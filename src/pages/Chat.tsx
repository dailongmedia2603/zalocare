import { useState } from 'react';
import InboxPanel from '@/components/chat/InboxPanel';
import ConversationPanel from '@/components/chat/ConversationPanel';
import CustomerInfoPanel from '@/components/chat/CustomerInfoPanel';
import { mockConversations } from '@/data/mock-chat-data';

const Chat = () => {
  const [conversations] = useState(mockConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversations[0]?.id || null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  return (
    <div className="flex h-full w-full">
      <InboxPanel 
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      <ConversationPanel conversation={selectedConversation} />
      <CustomerInfoPanel conversation={selectedConversation} />
    </div>
  );
};

export default Chat;