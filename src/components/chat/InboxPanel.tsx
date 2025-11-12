import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Mail, Inbox } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConversationItem from './ConversationItem';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { ConversationInboxItem } from '@/types/chat';

interface InboxPanelProps {
  conversations: ConversationInboxItem[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const InboxPanel = ({ conversations, selectedConversationId, onSelectConversation }: InboxPanelProps) => {
  const [filter, setFilter] = useState('all');

  const unreadCount = conversations.filter(c => c.unread_count > 0).length;
  const allCount = conversations.length;

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'unread') {
      return conv.unread_count > 0;
    }
    return true;
  });

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex items-center gap-2", filter === 'unread' ? 'bg-orange-50 text-orange-600' : '')}
                onClick={() => setFilter('unread')}
              >
                <Mail className="w-4 h-4" />
                <span className="font-semibold">{unreadCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chưa đọc</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex items-center gap-2", filter === 'all' ? 'bg-orange-50 text-orange-600' : '')}
                onClick={() => setFilter('all')}
              >
                <Inbox className="w-4 h-4" />
                <span className="font-semibold">{allCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tất cả</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.map((conv) => (
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