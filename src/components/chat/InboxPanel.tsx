import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/data/mock-chat-data';
import ConversationItem from './ConversationItem';

interface InboxPanelProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const InboxPanel = ({ conversations, selectedConversationId, onSelectConversation }: InboxPanelProps) => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="w-[320px] border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Hộp thư
        </h2>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Tìm kiếm khách hàng..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button 
            variant={filter === 'unread' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            Chưa đọc
          </Button>
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            Tất cả
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedConversationId}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InboxPanel;