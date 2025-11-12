import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage } from '@/types/chat';

// Fetch all conversations for the inbox view
export const useConversations = () => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zalo_conversations')
        .select(`
          id,
          last_message_preview,
          last_message_at,
          unread_count,
          customer:zalo_customers (*)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw new Error(error.message);
      // The type from Supabase might not match exactly, so we cast it.
      return data as unknown as ConversationInboxItem[];
    },
  });
};

// Fetch messages for a single selected conversation
export const useMessages = (conversationId: string | null) => {
    return useQuery<ZaloMessage[]>({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const { data, error } = await supabase
                .from('zalo_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('sent_at', { ascending: true });

            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!conversationId,
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
                { event: '*', schema: 'public', table: 'zalo_messages' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    queryClient.invalidateQueries({ queryKey: ['messages'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'zalo_conversations' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};