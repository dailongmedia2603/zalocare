import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage, ZaloCustomer } from '@/types/chat';
import { Tag } from '@/pages/Tags';

// This function transforms the flat data from Supabase into a structured conversation list
const transformDataToConversations = (
  customers: any[] | null
): ConversationInboxItem[] => {
  if (!customers) {
    return [];
  }

  // Find the latest event for each customer to use as the preview
  const conversationMap = new Map<string, ConversationInboxItem>();

  for (const customer of customers) {
    const latestEvent = customer.zalo_events && customer.zalo_events.length > 0 ? customer.zalo_events[0] : null;
    
    const conversation: ConversationInboxItem = {
      id: customer.id, // Use customer id as conversation id
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
    conversationMap.set(customer.id, conversation);
  }

  return Array.from(conversationMap.values()).sort((a, b) => 
    new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime()
  );
};

// Fetch all conversations for the inbox view
export const useConversations = () => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch customers and their related tags and latest message
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          tags (*),
          zalo_events ( content, ts )
        `)
        .eq('user_id', user.id)
        .order('ts', { foreignTable: 'zalo_events', ascending: false })
        .limit(1, { foreignTable: 'zalo_events' });

      if (error) throw new Error(error.message);
      
      return transformDataToConversations(data);
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