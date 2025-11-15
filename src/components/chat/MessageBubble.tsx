import { cn } from '@/lib/utils';
import { ZaloMessage } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MessageBubbleProps {
  message: ZaloMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = !message.is_from_customer;

  /**
   * Checks if the content is a structured message (like a JSON object from Zalo).
   * @param content The message content string.
   * @returns True if the content is likely a structured message, false otherwise.
   */
  const isStructuredMessage = (content: string | null | undefined): boolean => {
    if (!content) {
      return false;
    }
    const trimmedContent = content.trim();
    // Heuristic: If it looks like a JSON object, we treat it as structured content.
    if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
      try {
        JSON.parse(trimmedContent);
        return true; // It's a valid JSON string.
      } catch (e) {
        return false; // It's not valid JSON.
      }
    }
    return false;
  };

  const shouldShowContent = message.content && !isStructuredMessage(message.content);
  const formattedTime = format(new Date(message.sent_at), 'HH:mm', { locale: vi });

  return (
    <div className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-2xl',
          isMe
            ? 'bg-orange-500 text-white rounded-br-none'
            : 'bg-white border rounded-bl-none'
        )}
      >
        {shouldShowContent && <p className="text-sm">{message.content}</p>}
        
        {message.image_url && (
          <Dialog>
            <DialogTrigger asChild>
              <img
                src={message.image_url}
                alt="Hình ảnh đính kèm"
                className={cn(
                  "mt-2 w-48 h-auto rounded-lg cursor-pointer object-cover",
                  !shouldShowContent && "mt-0" // Remove margin top if there is no text content
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
      <span className="text-xs text-gray-400 px-1">{formattedTime}</span>
    </div>
  );
};

export default MessageBubble;