import { cn } from '@/lib/utils';
import { Message } from '@/data/mock-chat-data';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.sender === 'me';

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
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;