import { useState, useEffect } from 'react';
import InboxPanel from '@/components/chat/InboxPanel';
import ConversationPanel from '@/components/chat/ConversationPanel';
import CustomerInfoPanel from '@/components/chat/CustomerInfoPanel';
import { useConversations, useChatSubscription } from '@/hooks/use-chat';
import { Skeleton } from '@/components/ui/skeleton';

const Chat = () => {
  // This custom hook sets up the real-time subscription for the entire chat interface.
  useChatSubscription();

  const { data: conversations, isLoading } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Auto-select the first conversation when data loads or changes.
  useEffect(() => {
    if (!selectedConversationId && conversations && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId) || null;

  if (isLoading) {
    return (
      <div className="flex h-full w-full">
        <Skeleton className="w-[320px] h-full" />
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