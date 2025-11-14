import { cn } from '@/lib/utils';
import { ZaloMessage } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

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
        {message.content && <p className="text-sm">{message.content}</p>}
        
        {message.image_url && (
          <Dialog>
            <DialogTrigger asChild>
              <img
                src={message.image_url}
                alt="Hình ảnh đính kèm"
                className={cn(
                  "mt-2 w-48 h-auto rounded-lg cursor-pointer object-cover",
                  !message.content && "mt-0" // Remove margin top if there is no text
                )}
              />
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none flex items-center justify-center">
              <img
                src={message.image_url}
                alt="Hình ảnh đính kèm"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;