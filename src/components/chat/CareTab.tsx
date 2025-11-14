import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Image as ImageIcon, Send, Trash2, Loader2, Clock, Bell, X, Sparkles } from 'lucide-react';
import { format, set } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import ImageSelectorDialog from './ImageSelectorDialog';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AiLogsDialog } from './AiLogsDialog';

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
        .order('scheduled_at', { ascending: false });
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

  useEffect(() => {
    const channel = supabase
      .channel(`care-tab-updates-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_messages',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['scheduledMessages', customerId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_prompt_logs',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['aiPromptLogs', customerId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, customerId]);

  const addMessageMutation = useMutation({
    mutationFn: async (newMessage: Omit<ScheduledMessage, 'id' | 'user_id' | 'status' | 'created_at' | 'prompt_log'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('scheduled_messages').insert({ ...newMessage, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
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
      showSuccess('Đã xóa lịch gửi!');
    },
    onError: (error: Error) => showError(`Lỗi: ${error.message}`),
  });

  const generateAiMessageMutation = useMutation<unknown, Error, void, { toastId: string | number }>({
    mutationFn: async () => {
      const hasPendingMessages = scheduledMessages?.some(msg => msg.status === 'pending');
      if (hasPendingMessages) {
        throw new Error('Đã có lịch chăm sóc đang chờ. AI sẽ không tạo thêm.');
      }

      // **THE FIX**: Manually get the latest session token to prevent "Unauthorized" error.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      }

      const { data, error } = await supabase.functions.invoke('generate-care-message', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: { threadId },
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
    onMutate: () => {
      const toastId = showLoading("AI đang phân tích và tạo lịch chăm sóc...");
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      if (context?.toastId) dismissToast(context.toastId as string);
      showSuccess('AI đã tự động lên lịch chăm sóc thành công!');
    },
    onError: (error: Error, variables, context) => {
      if (context?.toastId) dismissToast(context.toastId as string);
      showError(`Lỗi: ${error.message}`);
    },
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

  const statusConfig = {
    pending: { label: 'Chờ gửi', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    sent: { label: 'Đã gửi', className: 'bg-green-500 hover:bg-green-600 text-white' },
    failed: { label: 'Thất bại', className: 'bg-red-500 hover:bg-red-600 text-white' },
  };

  const pendingCount = scheduledMessages?.filter(msg => msg.status === 'pending').length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-600">Tạo lịch gửi tin mới</h4>
          <div className="flex items-center space-x-2">
            <AiLogsDialog customerId={customerId} />
            <Sparkles className="h-5 w-5 text-orange-500" />
            <Label htmlFor="ai-cskh-toggle" className="font-semibold text-sm text-gray-700">AI CSKH</Label>
            <Switch
              id="ai-cskh-toggle"
              checked={generateAiMessageMutation.isPending}
              onCheckedChange={(checked) => {
                if (checked) {
                  generateAiMessageMutation.mutate();
                }
              }}
              disabled={generateAiMessageMutation.isPending}
            />
          </div>
        </div>
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
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500 text-white h-5 px-1.5">{pendingCount}</Badge>
          )}
        </h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : scheduledMessages && scheduledMessages.length > 0 ? (
          scheduledMessages.map((msg) => {
            const currentStatus = statusConfig[msg.status as keyof typeof statusConfig] || { label: msg.status, className: 'bg-gray-400' };
            return (
              <div
                key={msg.id}
                className={cn(
                  'p-3 rounded-lg border',
                  msg.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
                  msg.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50/80'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {format(new Date(msg.scheduled_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                      </div>
                      <Badge className={cn("border-transparent", currentStatus.className)}>
                        {currentStatus.label}
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
              </div>
            );
          })
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