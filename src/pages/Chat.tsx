import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import InboxPanel from '@/components/chat/InboxPanel';
import ConversationPanel from '@/components/chat/ConversationPanel';
import CustomerInfoPanel from '@/components/chat/CustomerInfoPanel';
import { useConversations } from '@/hooks/use-chat';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatContext {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const Chat = () => {
  const queryClient = useQueryClient();

  // Centralized real-time subscription for the entire chat page
  useEffect(() => {
    const handleChanges = (payload: any) => {
      // Invalidate conversations list for any change on these tables
      // This updates message previews, order, customer names, tags, etc.
      if (['zalo_events', 'customers', 'customer_tags', 'inbox_folders'].includes(payload.table)) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }

      // Invalidate notes for a specific customer (for the right-side panel)
      if (payload.table === 'notes') {
        const customerId = payload.new?.customer_id || payload.old?.customer_id;
        if (customerId) {
          queryClient.invalidateQueries({ queryKey: ['notes', customerId] });
        }
      }
      
      // Invalidate folder list if folders change (for the sidebar)
      if (payload.table === 'inbox_folders') {
        queryClient.invalidateQueries({ queryKey: ['inbox_folders'] });
      }
    };

    const channel = supabase
      .channel('zalo-chat-page-realtime') // A single channel for the whole page
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zalo_events' }, handleChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, handleChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_tags' }, handleChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, handleChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_folders' }, handleChanges)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedFolderId, setSelectedFolderId } = useOutletContext<ChatContext>();
  const { data: conversations, isLoading } = useConversations(selectedFolderId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    const conversationIdFromState = location.state?.selectedConversationId;

    if (conversationIdFromState) {
      setSelectedConversationId(conversationIdFromState);
      setSelectedFolderId(null); // Reset to "All" folder to ensure the conversation is visible
      navigate(location.pathname, { replace: true, state: {} });
    } else if (!selectedConversationId && conversations && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    } else if (conversations && conversations.length === 0) {
      setSelectedConversationId(null);
    }
  }, [conversations, selectedConversationId, location.state, navigate, location.pathname, setSelectedFolderId]);

  // When folder changes, reset selection
  useEffect(() => {
    setSelectedConversationId(null);
  }, [selectedFolderId]);

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId) || null;

  if (isLoading) {
    return (
      <div className="flex h-full w-full">
        <div className="w-[320px] border-r p-2 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-[65px] border-b" />
          <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-10 w-3/5" />
            <Skeleton className="h-10 w-2/5 ml-auto" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          <Skeleton className="h-[80px] border-t" />
        </div>
        <Skeleton className="w-[360px] h-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <InboxPanel 
        conversations={conversations || []}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        selectedFolderId={selectedFolderId}
      />
      <ConversationPanel conversation={selectedConversation} />
      <CustomerInfoPanel conversation={selectedConversation} />
    </div>
  );
};

export default Chat;