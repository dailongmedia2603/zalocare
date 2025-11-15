import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { ConversationInboxItem, ZaloMessage } from '@/types/chat';
import { InboxFolder } from '@/types/inbox';

// Fetch all conversations for the inbox view using a database function
export const useConversations = (folderId: string | null) => {
  return useQuery<ConversationInboxItem[]>({
    queryKey: ['conversations', folderId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_user_conversations_inbox', { 
          p_user_id: user.id,
          p_folder_id: folderId,
        });

      if (error) {
        console.error("Error fetching conversations via RPC:", error);
        throw new Error(error.message);
      }
      
      return data || [];
    },
  });
};

// Fetch all inbox folders
export const useInboxFolders = () => {
  return useQuery<InboxFolder[]>({
    queryKey: ['inbox_folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_folders')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    }
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
              image_url: event.image_url, // Map the new image_url field
            }));
        },
        enabled: !!threadId,
    });
};

// Custom hook to listen for real-time changes in the database
export const useChatSubscription = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleZaloEventChange = () => {
            // This will refetch the conversation list to update previews, unread counts, etc.
            // Individual message updates are now handled within the ConversationPanel itself.
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };

        const handleCustomerDataChange = () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };

        const handleNoteChange = (payload: any) => {
            const customerId = payload.new?.customer_id || payload.old?.customer_id;
            if (customerId) {
                queryClient.invalidateQueries({ queryKey: ['notes', customerId] });
            }
        };

        const handleFolderChange = () => {
            queryClient.invalidateQueries({ queryKey: ['inbox_folders'] });
        };

        const channel = supabase.channel('zalo-chat-realtime-updates');

        channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'zalo_events' }, handleZaloEventChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, handleCustomerDataChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_tags' }, handleCustomerDataChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, handleNoteChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_folders' }, handleFolderChange)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};