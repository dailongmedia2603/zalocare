import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConversationInboxItem } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { icons } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ConversationItemProps {
  conversation: ConversationInboxItem;
  isSelected: boolean;
  onClick: () => void;
  isMultiSelected: boolean;
  onMultiSelect: (id: string, checked: boolean) => void;
}

const ConversationItem = ({ conversation, isSelected, onClick, isMultiSelected, onMultiSelect }: ConversationItemProps) => {
  const customerName = conversation.customer?.display_name || 'Khách hàng mới';
  const avatarUrl = conversation.customer?.avatar_url;
  
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: vi })
    : '';

  const truncateWords = (text: string | null | undefined, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const truncatedPreview = truncateWords(conversation.last_message_preview, 9);

  return (
    <div
      className={cn(
        'flex items-center p-3 rounded-lg transition-colors border-l-4 gap-3',
        isSelected ? 'bg-orange-50 border-orange-500' : 'hover:bg-gray-50 border-transparent'
      )}
    >
      <Checkbox
        checked={isMultiSelected}
        onCheckedChange={(checked) => onMultiSelect(conversation.id, !!checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <div onClick={onClick} className="flex flex-col flex-1 cursor-pointer">
        <div className="flex items-start w-full">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={avatarUrl || '/placeholder.svg'} alt={customerName} />
            <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{customerName}</h3>
              <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo}</span>
            </div>
            <div className="flex justify-between items-start mt-1">
              <p className="text-xs text-gray-500 pr-2">
                {truncatedPreview}
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
    </div>
  );
};

export default ConversationItem;