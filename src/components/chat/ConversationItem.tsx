import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConversationInboxItem } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: ConversationInboxItem;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const customerName = conversation.customer?.display_name || 'Unknown User';
  
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: vi })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start p-3 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
      )}
    >
      <Avatar className="w-10 h-10 mr-3">
        <AvatarImage src={conversation.customer?.avatar_url || '/placeholder.svg'} alt={customerName} />
        <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm truncate">{customerName}</h3>
          <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
        </div>
        <div className="flex justify-between items-start mt-1">
          <p className="text-xs text-gray-500 truncate pr-2">
            {conversation.last_message_preview}
          </p>
          {conversation.unread_count > 0 && (
            <Badge className="bg-orange-500 text-white h-5 px-2">{conversation.unread_count}</Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;