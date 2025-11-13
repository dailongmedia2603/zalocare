import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const N8NWebhookSettings = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('settings')
          .select('n8n_webhook_url')
          .eq('user_id', user.id)
          .single();

        if (data && data.n8n_webhook_url) {
          setWebhookUrl(data.n8n_webhook_url);
        }
        if (error && error.code !== 'PGRST116') { // Ignore 'no rows found' error
          console.error('Error fetching settings:', error);
          showError('Không thể tải cài đặt webhook.');
        }
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      showError('Không tìm thấy thông tin người dùng.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, n8n_webhook_url: webhookUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      showError('Lưu cài đặt thất bại.');
      console.error('Error saving settings:', error);
    } else {
      showSuccess('Đã lưu cài đặt webhook!');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cấu hình Webhook N8N</h3>
        <p className="text-sm text-gray-500">
          Nhập URL webhook từ n8n để gửi tin nhắn Zalo từ hệ thống này.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-n8n-instance.com/webhook/..."
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving || !webhookUrl}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {isSaving ? 'Đang lưu...' : 'Lưu'}
      </Button>
    </div>
  );
};

export default N8NWebhookSettings;