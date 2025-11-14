import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage } from '@/types/chat';

// Fetch all conversations for the inbox view using a database function
export const useConversations = () => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Gọi RPC function để lấy dữ liệu cuộc trò chuyện.
      // Function này hiệu quả và đáng tin cậy hơn vì nó tính toán tin nhắn mới nhất ở phía database.
      const { data, error } = await supabase
        .rpc('get_user_conversations_inbox', { p_user_id: user.id });

      if (error) {
        console.error("Error fetching conversations via RPC:", error);
        throw new Error(error.message);
      }
      
      // RPC function được thiết kế để trả về dữ liệu có cấu trúc chính xác như ConversationInboxItem[]
      return data || [];
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
        // Define a handler for Zalo event changes
        const handleZaloEventChange = (payload: any) => {
            // Invalidate the main conversations list to update previews, order, etc.
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            // Invalidate messages for the specific conversation that received an update
            const threadId = payload.new?.threadId || payload.old?.threadId;
            if (threadId) {
                queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
            }
        };

        // Define a handler for customer/tag changes
        const handleCustomerDataChange = () => {
            // If customer info (like name or avatar) or tags change, refetch conversations
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };

        // Define a handler for note changes
        const handleNoteChange = (payload: any) => {
            const customerId = payload.new?.customer_id || payload.old?.customer_id;
            if (customerId) {
                queryClient.invalidateQueries({ queryKey: ['notes', customerId] });
            }
        };

        // Use a unique channel name to avoid potential conflicts
        const channel = supabase.channel('zalo-chat-realtime-updates');

        // Subscribe to all relevant table changes
        channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'zalo_events' }, handleZaloEventChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, handleCustomerDataChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_tags' }, handleCustomerDataChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, handleNoteChange)
            .subscribe();

        // Cleanup function to remove the subscription when the component unmounts
        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};