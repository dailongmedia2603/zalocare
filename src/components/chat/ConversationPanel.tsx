import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationInboxItem } from '@/types/chat';
import { Phone, Video, Info, Paperclip, SendHorizonal, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useMessages } from '@/hooks/use-chat';
import { useEffect, useRef } from 'react';

interface ConversationPanelProps {
  conversation: ConversationInboxItem | null;
}

const ConversationPanel = ({ conversation }: ConversationPanelProps) => {
  const { data: messages, isLoading } = useMessages(conversation?.id || null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50/50">
        Chọn một cuộc trò chuyện để bắt đầu
      </div>
    );
  }

  const customerName = conversation.customer?.display_name || 'Khách hàng mới';
  const avatarUrl = conversation.customer?.avatar_url;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl || '/placeholder.svg'} />
            <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold">{customerName}</h3>
            {/* Online status can be added later */}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Info className="w-5 h-5" /></Button>
        </div>
      </div>
      <ScrollArea className="flex-1 bg-gray-50/50" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            messages?.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          <Input placeholder="Nhập tin nhắn..." className="flex-1" />
          <Button className="bg-orange-500 hover:bg-orange-600">
            <SendHorizonal className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;