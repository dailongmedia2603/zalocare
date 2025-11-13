import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage } from '@/types/chat';

// Fetch all conversations for the inbox view, starting from events
export const useConversations = () => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. Get the latest event for each distinct threadId from zalo_events
      const { data: allEvents, error: eventsError } = await supabase
        .from('zalo_events')
        .select('threadId, content, ts, dName')
        .eq('user_id', user.id)
        .order('ts', { ascending: false });

      if (eventsError) throw new Error(eventsError.message);
      if (!allEvents) return [];

      const latestEventsMap = new Map<string, { content: string | null, ts: string, dName: string | null }>();
      const uniqueThreadIds: string[] = [];
      for (const event of allEvents) {
        if (!latestEventsMap.has(event.threadId)) {
          latestEventsMap.set(event.threadId, {
            content: event.content,
            ts: event.ts,
            dName: event.dName,
          });
          uniqueThreadIds.push(event.threadId);
        }
      }

      if (uniqueThreadIds.length === 0) return [];

      // 2. Fetch corresponding customers and their tags to enrich the data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, zalo_id, display_name, avatar_url, tags (*)')
        .in('zalo_id', uniqueThreadIds);

      if (customersError) throw new Error(customersError.message);

      const customersMap = new Map();
      if (customers) {
        for (const customer of customers) {
          customersMap.set(customer.zalo_id, customer);
        }
      }

      // 3. Combine event data with customer data
      const conversations: ConversationInboxItem[] = uniqueThreadIds.map(threadId => {
        const latestEvent = latestEventsMap.get(threadId)!;
        const customer = customersMap.get(threadId);

        const customerData = customer
          ? {
              id: customer.id,
              zalo_id: customer.zalo_id,
              // Prioritize the display_name from the customers table as requested.
              display_name: customer.display_name || latestEvent.dName || 'Khách hàng mới',
              avatar_url: customer.avatar_url || null,
            }
          : null;

        return {
          id: threadId, // The conversation ID is now the threadId
          last_message_preview: latestEvent.content || 'No messages yet',
          last_message_at: latestEvent.ts,
          unread_count: 0, // Placeholder for unread count logic
          customer: customerData,
          tags: customer ? customer.tags : [],
        };
      });

      // 4. Sort conversations by the most recent message
      return conversations.sort((a, b) =>
        new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime()
      );
    },
  });
};


// Fetch messages for a single selected conversation (by threadId)
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
            .channel('realtime-chat-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'zalo_events' },
                () => {
                    // When a new message arrives, invalidate queries to refetch data.
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    queryClient.invalidateQueries({ queryKey: ['messages'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                () => {
                    // If customer info (like name) changes, update the conversation list.
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customer_tags' },
                () => {
                    // If tags change, update the conversation list.
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }
            )
            .subscribe();

        // Cleanup function to remove the subscription when the component unmounts.
        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};