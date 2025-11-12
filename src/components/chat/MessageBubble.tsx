import { cn } from '@/lib/utils';
import { ZaloMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ZaloMessage;
  customerZaloId: string;
}

const MessageBubble = ({ message, customerZaloId }: MessageBubbleProps) => {
  // A message is "from me" if the sender is NOT the customer
  const isMe = message.sender_zalo_id !== customerZaloId;

  return (
    <div className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-2xl',
          isMe
            ? 'bg-orange-500 text-white rounded-br-none'
            : 'bg-white border rounded-bl-none'
        )}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;