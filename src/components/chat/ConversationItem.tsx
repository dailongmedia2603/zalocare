import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation } from '@/data/mock-chat-data';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start p-3 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
      )}
    >
      <Avatar className="w-10 h-10 mr-3">
        <AvatarImage src={conversation.customer.avatarUrl} alt={conversation.customer.name} />
        <AvatarFallback>{conversation.customer.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm truncate">{conversation.customer.name}</h3>
          <span className="text-xs text-gray-500 whitespace-nowrap">{conversation.lastMessageTimestamp}</span>
        </div>
        <div className="flex justify-between items-start mt-1">
          <p className="text-xs text-gray-500 truncate pr-2">
            {lastMessage.text}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge className="bg-orange-500 text-white h-5 px-2">{conversation.unreadCount}</Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;