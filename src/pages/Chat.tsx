import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import InboxPanel from '@/components/chat/InboxPanel';
import ConversationPanel from '@/components/chat/ConversationPanel';
import CustomerInfoPanel from '@/components/chat/CustomerInfoPanel';
import { useConversations, useChatSubscription } from '@/hooks/use-chat';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatContext {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const Chat = () => {
  useChatSubscription();
  
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
      />
      <ConversationPanel conversation={selectedConversation} />
      <CustomerInfoPanel conversation={selectedConversation} />
    </div>
  );
};

export default Chat;