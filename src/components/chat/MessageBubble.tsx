import { cn } from '@/lib/utils';
import { ZaloMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ZaloMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = !message.is_from_customer;

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