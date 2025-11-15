import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConversationInboxItem } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { icons } from 'lucide-react';

interface ConversationItemProps {
  conversation: ConversationInboxItem;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const customerName = conversation.customer?.display_name || 'Khách hàng mới';
  const avatarUrl = conversation.customer?.avatar_url;
  
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: vi })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col p-3 rounded-lg cursor-pointer transition-colors border-l-4',
        isSelected ? 'bg-orange-50 border-orange-500' : 'hover:bg-gray-50 border-transparent'
      )}
    >
      <div className="flex items-start w-full">
        <Avatar className="w-10 h-10 mr-3">
          <AvatarImage src={avatarUrl || '/placeholder.svg'} alt={customerName} />
          <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-semibold text-sm truncate min-w-0 flex-1">{customerName}</h3>
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
      {conversation.tags && conversation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pl-12">
          {conversation.tags.slice(0, 2).map(tag => {
            const Icon = icons[tag.icon as keyof typeof icons] || icons['Tag'];
            return (
              <Badge key={tag.id} variant="secondary" className={cn("py-0.5 px-1.5 gap-1 text-xs", tag.color, "text-white")}>
                <Icon className="w-2.5 h-2.5" />
                {tag.name}
              </Badge>
            )
          })}
          {conversation.tags.length > 2 && (
            <Badge variant="secondary" className="py-0.5 px-1.5 text-xs">
              +{conversation.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationItem;