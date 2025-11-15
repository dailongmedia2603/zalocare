import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationInboxItem } from '@/types/chat';
import { Image, SendHorizonal, Loader2, X, Edit, Check, XCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useMessages } from '@/hooks/use-chat';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import ImageSelectorDialog from './ImageSelectorDialog';

interface ConversationPanelProps {
  conversation: ConversationInboxItem | null;
}

const ConversationPanel = ({ conversation }: ConversationPanelProps) => {
  const { data: messages, isLoading } = useMessages(conversation?.id || null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const queryClient = useQueryClient();

  const customerName = conversation?.customer?.display_name || 'Khách hàng mới';
  const avatarUrl = conversation?.customer?.avatar_url;

  useEffect(() => {
    if (conversation) {
      setEditedName(customerName);
      setIsEditingName(false); // Reset editing state on conversation change
    }
  }, [conversation, customerName]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ newMessage, newImageUrl }: { newMessage: string, newImageUrl: string }) => {
      if (!conversation) throw new Error("Không có cuộc trò chuyện nào được chọn");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
      }

      const { error, data } = await supabase.functions.invoke('send-n8n-message', {
        body: {
          threadId: conversation.id,
          message: newMessage,
          imageUrl: newImageUrl,
        },
      });
      
      if (error) {
        try {
          const errorJson = await error.context.json();
          throw new Error(errorJson.error || 'Lỗi không xác định từ function.');
        } catch (e) {
          throw new Error(error.message);
        }
      }
      return data;
    },
    onSuccess: () => {
      showSuccess("Tin nhắn đã được gửi!");
      setMessage('');
      setImageUrl('');
    },
    onError: (error: Error) => {
      if (error.message.includes('N8N webhook URL not configured')) {
        showError("Lỗi: Vui lòng cấu hình Webhook N8N trong Cài đặt.");
      } else {
        showError(`Lỗi khi gửi tin nhắn: ${error.message}`);
      }
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!conversation?.customer?.id) throw new Error("Customer ID not found");
      const { error } = await supabase
        .from('customers')
        .update({ display_name: newName })
        .eq('id', conversation.customer.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Tên khách hàng đã được cập nhật!");
      setIsEditingName(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    }
  });

  const handleSendMessage = () => {
    if (message.trim() || imageUrl.trim()) {
      sendMessageMutation.mutate({ newMessage: message.trim(), newImageUrl: imageUrl.trim() });
    }
  };

  const handleSelectImage = (url: string) => {
    setImageUrl(url);
    setIsImageSelectorOpen(false);
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName.trim() !== customerName) {
      updateNameMutation.mutate(editedName.trim());
    } else {
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    // Use a timeout to allow the DOM to update with new messages before scrolling
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' });
        }
      }
    }, 0);
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50/50">
        Chọn một cuộc trò chuyện để bắt đầu
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={avatarUrl || '/placeholder.svg'} />
              <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave() }}
                    className="h-8"
                    autoFocus
                  />
                  <Button size="icon" className="h-8 w-8" onClick={handleNameSave} disabled={updateNameMutation.isPending}>
                    {updateNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingName(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h3 className="font-bold">{customerName}</h3>
                  {conversation.customer?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 group" onClick={() => setIsEditingName(true)}>
                      <Edit className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </Button>
                  )}
                </div>
              )}
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
          {imageUrl && (
            <div className="relative w-24 h-24 mb-2">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => setImageUrl('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsImageSelectorOpen(true)}>
              <Image className="w-5 h-5 text-gray-500" />
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
              disabled={sendMessageMutation.isPending || (!message.trim() && !imageUrl.trim())}
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
      <ImageSelectorDialog
        open={isImageSelectorOpen}
        onOpenChange={setIsImageSelectorOpen}
        onSelectImage={handleSelectImage}
      />
    </>
  );
};

export default ConversationPanel;