import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage } from '@/types/chat';

// Fetch all conversations for the inbox view
export const useConversations = () => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Step 1: Fetch customers and their related tags
      const { data: customersWithTags, error: customerError } = await supabase
        .from('customers')
        .select('*, tags (*)')
        .eq('user_id', user.id);

      if (customerError) throw new Error(customerError.message);
      if (!customersWithTags || customersWithTags.length === 0) return [];

      // Step 2: Get all customer zalo_ids
      const customerZaloIds = customersWithTags.map(c => c.zalo_id);

      // Step 3: Fetch all events for these customers to find the latest one for each
      const { data: allEvents, error: eventsError } = await supabase
        .from('zalo_events')
        .select('threadId, content, ts')
        .in('threadId', customerZaloIds)
        .order('ts', { ascending: false });

      if (eventsError) throw new Error(eventsError.message);

      // Create a map of the latest event for each conversation (threadId)
      const latestEventsMap = new Map<string, { content: string | null, ts: string }>();
      if (allEvents) {
        for (const event of allEvents) {
          if (!latestEventsMap.has(event.threadId)) {
            latestEventsMap.set(event.threadId, { content: event.content, ts: event.ts });
          }
        }
      }

      // Step 4: Combine customer data with their latest message
      const conversations: ConversationInboxItem[] = customersWithTags.map(customer => {
        const latestEvent = latestEventsMap.get(customer.zalo_id);
        return {
          id: customer.id,
          last_message_preview: latestEvent?.content || 'No messages yet',
          last_message_at: latestEvent?.ts || customer.created_at,
          unread_count: 0, // Unread count logic needs to be implemented separately
          customer: {
            id: customer.id,
            zalo_id: customer.zalo_id,
            display_name: customer.display_name || 'Khách hàng',
            avatar_url: customer.avatar_url || null,
          },
          tags: customer.tags || [],
        };
      });

      // Sort conversations by the most recent message
      return conversations.sort((a, b) => 
        new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime()
      );
    },
  });
};


// Fetch messages for a single selected conversation (customer)
export const useMessages = (customerId: string | null) => {
    return useQuery<ZaloMessage[]>({
        queryKey: ['messages', customerId],
        queryFn: async () => {
            if (!customerId) return [];

            // Messages are in zalo_events, we need to find the threadId (customer's zalo_id)
            const { data: customer, error: customerError } = await supabase
              .from('customers')
              .select('zalo_id')
              .eq('id', customerId)
              .single();
            
            if (customerError || !customer) throw new Error("Customer not found");

            const { data, error } = await supabase
                .from('zalo_events')
                .select('*')
                .eq('threadId', customer.zalo_id)
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
        enabled: !!customerId,
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
                { event: '*', schema: 'public', table: 'zalo_events' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    // We can refine this to not invalidate all messages queries later
                    queryClient.invalidateQueries({ queryKey: ['messages'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customer_tags' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    queryClient.invalidateQueries({ queryKey: ['customer_tags'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};