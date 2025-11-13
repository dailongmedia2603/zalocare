import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationInboxItem } from '@/types/chat';
import { Paperclip, SendHorizonal, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useMessages } from '@/hooks/use-chat';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface ConversationPanelProps {
  conversation: ConversationInboxItem | null;
}

const ConversationPanel = ({ conversation }: ConversationPanelProps) => {
  const { data: messages, isLoading } = useMessages(conversation?.id || null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: string) => {
      if (!conversation) throw new Error("Không có cuộc trò chuyện nào được chọn");

      const { error, data } = await supabase.functions.invoke('send-n8n-message', {
        body: {
          threadId: conversation.id,
          message: newMessage,
        },
      });
      
      // The function now returns a structured error, so we can parse it.
      if (error) {
         // Try to parse the error response from the function
        try {
          const errorJson = await error.context.json();
          throw new Error(errorJson.error || 'Lỗi không xác định từ function.');
        } catch (e) {
          throw new Error(error.message); // Fallback to original error message
        }
      }
      return data;
    },
    onSuccess: () => {
      showSuccess("Tin nhắn đã được gửi!");
      setMessage('');
      // Note: We don't invalidate queries here. The message will appear
      // when the Zalo webhook sends the event back to our app, which is the
      // source of truth for the conversation history.
    },
    onError: (error: Error) => {
      if (error.message.includes('N8N webhook URL not configured')) {
        showError("Lỗi: Vui lòng cấu hình Webhook N8N trong Cài đặt.");
      } else {
        showError(`Lỗi khi gửi tin nhắn: ${error.message}`);
      }
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50/50">
        Chọn một cuộc trò chuyện để bắt đầu
      </div>
    );
  }

  const customerName = conversation.customer?.display_name || 'Khách hàng mới';
  const avatarUrl = conversation.customer?.avatar_url;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl || '/placeholder.svg'} />
            <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold">{customerName}</h3>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 bg-gray-50/50" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            messages?.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          <Input
            placeholder="Nhập tin nhắn..."
            className="flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !message.trim()}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SendHorizonal className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;