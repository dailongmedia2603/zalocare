import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Image as ImageIcon, Send, Trash2, Loader2, Clock, Bell, X } from 'lucide-react';
import { format, set } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import ImageSelectorDialog from './ImageSelectorDialog';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

interface CareTabProps {
  customerId: string;
  threadId: string;
}

const useScheduledMessages = (customerId: string) => {
  return useQuery<ScheduledMessage[]>({
    queryKey: ['scheduledMessages', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('customer_id', customerId)
        .order('scheduled_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

const CareTab = ({ customerId, threadId }: CareTabProps) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const { data: scheduledMessages, isLoading } = useScheduledMessages(customerId);

  const addMessageMutation = useMutation({
    mutationFn: async (newMessage: Omit<ScheduledMessage, 'id' | 'user_id' | 'status' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('scheduled_messages').insert({ ...newMessage, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledMessages', customerId] });
      showSuccess('Đã lên lịch gửi tin nhắn!');
      setContent('');
      setImageUrl('');
    },
    onError: (error: Error) => showError(`Lỗi: ${error.message}`),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('scheduled_messages').delete().eq('id', messageId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledMessages', customerId] });
      showSuccess('Đã xóa lịch gửi!');
    },
    onError: (error: Error) => showError(`Lỗi: ${error.message}`),
  });

  const handleSchedule = () => {
    if (!content.trim() && !imageUrl) {
      showError('Vui lòng nhập nội dung hoặc chọn ảnh.');
      return;
    }
    if (!date) {
      showError('Vui lòng chọn ngày.');
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const scheduled_at = set(date, { hours, minutes });

    if (scheduled_at < new Date()) {
      showError('Không thể lên lịch gửi tin trong quá khứ.');
      return;
    }

    addMessageMutation.mutate({
      customer_id: customerId,
      thread_id: threadId,
      content: content.trim() || null,
      image_url: imageUrl || null,
      scheduled_at: scheduled_at.toISOString(),
    });
  };

  const handleSelectImage = (url: string) => {
    setImageUrl(url);
    setIsImageSelectorOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Tạo lịch gửi tin mới</h4>
        <div className="space-y-3">
          <Textarea
            placeholder="Nhập nội dung tin nhắn..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {imageUrl && (
            <div className="relative w-20 h-20">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md border" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={() => setImageUrl('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-[140px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-[100px]"
            />
            <Button variant="ghost" size="icon" onClick={() => setIsImageSelectorOpen(true)}>
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
          <Button onClick={handleSchedule} disabled={addMessageMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600">
            {addMessageMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Lên lịch
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Danh sách đã lên lịch
        </h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : scheduledMessages && scheduledMessages.length > 0 ? (
          scheduledMessages.map((msg) => (
            <div key={msg.id} className="p-3 rounded-lg border bg-gray-50/80 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {format(new Date(msg.scheduled_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </div>
                  <Badge variant={msg.status === 'pending' ? 'default' : 'secondary'} className={cn(msg.status === 'pending' && 'bg-yellow-500')}>
                    {msg.status}
                  </Badge>
                </div>
                {msg.content && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{msg.content}</p>}
                {msg.image_url && <img src={msg.image_url} alt="Scheduled" className="mt-2 rounded-md max-w-[100px] max-h-[100px]" />}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600"
                onClick={() => deleteMessageMutation.mutate(msg.id)}
                disabled={deleteMessageMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có lịch gửi nào.</p>
        )}
      </div>
      <ImageSelectorDialog
        open={isImageSelectorOpen}
        onOpenChange={setIsImageSelectorOpen}
        onSelectImage={handleSelectImage}
      />
    </div>
  );
};

export default CareTab;