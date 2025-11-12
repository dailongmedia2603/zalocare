import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage, ZaloCustomer } from '@/types/chat';

// This function transforms the flat data from zalo_events into a structured conversation list
const transformEventsToConversations = (
  events: any[],
  customersData: Map<string, { display_name: string | null, avatar_url: string | null }>
): ConversationInboxItem[] => {
  if (!events || events.length === 0) {
    return [];
  }

  const conversationMap = new Map<string, ConversationInboxItem>();

  for (const event of events) {
    const threadId = event.threadId; // threadId is the customer's Zalo ID
    
    if (!conversationMap.has(threadId)) {
      const customerEvent = events.find(e => e.threadId === threadId && e.isSelf === false);
      const customerProfile = customersData.get(threadId);

      const customer: ZaloCustomer = {
        id: threadId,
        zalo_id: threadId,
        display_name: customerProfile?.display_name || customerEvent?.dName || 'Khách hàng',
        avatar_url: customerProfile?.avatar_url || null,
      };

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
      const { data: events, error } = await supabase
        .from('zalo_events')
        .select('*')
        .order('ts', { ascending: false });

      if (error) throw new Error(error.message);
      if (!events || events.length === 0) return [];

      // 1. Get unique customer Zalo IDs from the threadId of events
      const customerZaloIds = [...new Set(events.map(e => e.threadId))];

      // 2. Fetch customer details from the new 'customers' table
      let customersData = new Map<string, { display_name: string | null, avatar_url: string | null }>();
      if (customerZaloIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('customers')
          .select('zalo_id, display_name, avatar_url')
          .in('zalo_id', customerZaloIds);

        if (profileError) {
          console.error("Error fetching customer profiles:", profileError);
        } else if (profiles) {
          for (const profile of profiles) {
            customersData.set(profile.zalo_id, {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            });
          }
        }
      }
      
      // 3. Pass the customer data to the transform function
      return transformEventsToConversations(events, customersData);
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
            .channel('realtime-chat-and-customers')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'zalo_events' },
                (payload) => {
                    const newMessage = payload.new as any;

                    // 1. Invalidate conversations to update inbox preview and order
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });

                    // 2. Optimistically update messages for the currently open conversation
                    queryClient.setQueryData(
                        ['messages', newMessage.threadId], 
                        (oldData: ZaloMessage[] | undefined) => {
                            const formattedMessage: ZaloMessage = {
                                id: newMessage.id,
                                conversation_id: newMessage.threadId,
                                content: newMessage.content,
                                sent_at: newMessage.ts,
                                is_from_customer: !newMessage.isSelf,
                                sender_zalo_id: newMessage.uidFrom,
                            };

                            if (!oldData) {
                                return [formattedMessage];
                            }

                            if (oldData.some(msg => msg.id === newMessage.id)) {
                                return oldData;
                            }
                            
                            return [...oldData, formattedMessage];
                        }
                    );
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                (_payload) => {
                    // When customer data changes (e.g., avatar or name updated),
                    // invalidate the conversations query to refetch and display the new data.
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};