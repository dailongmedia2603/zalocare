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
    const threadId = event.zalo_thread_id;
    
    // We only care about the latest message for the inbox view
    if (!conversationMap.has(threadId)) {
      const customer: ZaloCustomer = {
        id: event.sender_zalo_id, // Using zalo_id as the main identifier for customer
        zalo_id: event.sender_zalo_id,
        display_name: event.sender_display_name,
        avatar_url: null, // Can be added later if available
      };

      conversationMap.set(threadId, {
        id: threadId, // Use threadId as the unique conversation ID
        last_message_preview: event.content,
        last_message_at: event.sent_at,
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
      // This query cleverly gets the latest message for each conversation thread
      const { data, error } = await supabase
        .from('zalo_events')
        .select('*')
        .order('sent_at', { ascending: false });

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
                .eq('zalo_thread_id', threadId)
                .order('sent_at', { ascending: true });

            if (error) throw new Error(error.message);
            
            // Map the flat event data to the ZaloMessage type
            return data.map(event => ({
              id: event.id,
              conversation_id: event.zalo_thread_id,
              content: event.content,
              sent_at: event.sent_at,
              is_from_customer: event.is_from_customer,
              sender_zalo_id: event.sender_zalo_id,
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
                () => {
                    // Invalidate both queries when a new message arrives
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    queryClient.invalidateQueries({ queryKey: ['messages'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};