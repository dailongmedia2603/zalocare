import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/data/mock-chat-data';
import { Phone, Video, Info, Paperclip, SendHorizonal } from 'lucide-react';
import MessageBubble from './MessageBubble';

interface ConversationPanelProps {
  conversation: Conversation | null;
}

const ConversationPanel = ({ conversation }: ConversationPanelProps) => {
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Chọn một cuộc trò chuyện để bắt đầu
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={conversation.customer.avatarUrl} />
            <AvatarFallback>{conversation.customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold">{conversation.customer.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${conversation.customer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">{conversation.customer.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Info className="w-5 h-5" /></Button>
        </div>
      </div>
      <ScrollArea className="flex-1 bg-gray-50/50">
        <div className="p-4 space-y-4">
          {conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
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