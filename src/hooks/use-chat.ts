import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage, ZaloCustomer } from '@/types/chat';

// This function transforms the flat data from zalo_events into a structured conversation list
const transformEventsToConversations = (events: any[]): ConversationInboxItem[] => {
  if (!events || events.length === 0) {
    return [];
  }

  const conversationMap = new Map<string, ConversationInboxItem>();

  // Process all events to build the conversation list
  for (const event of events) {
    const threadId = event.threadId;
    
    // Since the list is sorted by time, the first time we see a threadId, it's the latest message
    if (!conversationMap.has(threadId)) {
      // Find an event from the customer in this thread to get their details
      const customerEvent = events.find(e => e.threadId === threadId && e.isSelf === false);
      
      let customer: ZaloCustomer;
      if (customerEvent) {
        customer = {
          id: customerEvent.uidFrom,
          zalo_id: customerEvent.uidFrom,
          display_name: customerEvent.dName || 'Khách hàng',
          avatar_url: null, // Avatar URL needs to be sourced from somewhere else
        };
      } else {
        // Fallback if only agent messages exist in the fetched data (e.g., agent started conversation)
        // We'll try to get customer ID from the `idTo` field of an agent's message
        const agentEvent = events.find(e => e.threadId === threadId && e.isSelf === true);
        const customerId = agentEvent ? agentEvent.idTo : 'unknown';
        customer = {
          id: customerId,
          zalo_id: customerId,
          display_name: 'Khách hàng', // We don't have the customer's name in this case
          avatar_url: null,
        };
      }

      conversationMap.set(threadId, {
        id: threadId,
        last_message_preview: event.content,
        last_message_at: event.ts,
        unread_count: 0, // Unread count logic needs to be implemented separately
        customer: customer,
      });
    }
  }

  return Array.from(conversationMap.values());
};


// Fetch all conversations for the inbox view
export const useConversations = () => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zalo_events')
        .select('*')
        .order('ts', { ascending: false });

      if (error) throw new Error(error.message);
      
      return transformEventsToConversations(data);
    },
  });
};

// Fetch messages for a single selected conversation
export const useMessages = (threadId: string | null) => {
    return useQuery<ZaloMessage[]>({
        queryKey: ['messages', threadId],
        queryFn: async () => {
            if (!threadId) return [];
            const { data, error } = await supabase
                .from('zalo_events')
                .select('*')
                .eq('threadId', threadId)
                .order('ts', { ascending: true });

            if (error) throw new Error(error.message);
            
            // Map the flat event data to the ZaloMessage type
            return data.map(event => ({
              id: event.id,
              conversation_id: event.threadId,
              content: event.content,
              sent_at: event.ts,
              is_from_customer: !event.isSelf,
              sender_zalo_id: event.uidFrom,
            }));
        },
        enabled: !!threadId,
    });
};

// Custom hook to listen for real-time changes in the database
export const useChatSubscription = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('zalo-chat-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'zalo_events' },
                (payload) => {
                    const newMessage = payload.new as any;

                    // 1. Invalidate the conversations list to update previews and order
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });

                    // 2. Update the messages for the specific conversation in real-time
                    queryClient.setQueryData(['messages', newMessage.threadId], (oldData: ZaloMessage[] | undefined) => {
                        if (oldData === undefined) return [];
                        
                        // Avoid adding duplicates
                        if (oldData.some(msg => msg.id === newMessage.id)) {
                            return oldData;
                        }

                        const formattedMessage: ZaloMessage = {
                            id: newMessage.id,
                            conversation_id: newMessage.threadId,
                            content: newMessage.content,
                            sent_at: newMessage.ts,
                            is_from_customer: !newMessage.isSelf,
                            sender_zalo_id: newMessage.uidFrom,
                        };
                        
                        return [...oldData, formattedMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};