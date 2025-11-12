import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plug, Loader2, Save } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const GeminiCustomSettings = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('settings')
          .select('gemini_api_url')
          .eq('user_id', user.id)
          .single();

        if (data && data.gemini_api_url) {
          setApiUrl(data.gemini_api_url);
        }
        if (error && error.code !== 'PGRST116') { // Ignore 'no rows found' error
          console.error('Error fetching settings:', error);
          showError('Không thể tải cài đặt.');
        }
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      showError('Không tìm thấy thông tin người dùng.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, gemini_api_url: apiUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      showError('Lưu cài đặt thất bại.');
      console.error('Error saving settings:', error);
    } else {
      showSuccess('Đã lưu cài đặt!');
    }
    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!apiUrl) {
      showError('Vui lòng nhập URL API.');
      return;
    }
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-gemini-api', {
        body: { apiUrl },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        showSuccess('Kết nối thành công!');
      } else {
        showError(`Kết nối thất bại: ${data.message || 'Lỗi không xác định'}`);
      }
    } catch (error: any) {
      showError('Kết nối thất bại. Vui lòng kiểm tra lại URL.');
      console.error('Function Invoke Error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cấu hình API Gemini Custom</h3>
        <p className="text-sm text-gray-500">
          Nhập URL API của bạn, lưu lại và kiểm tra kết nối để đảm bảo tích hợp thành công.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="api-url">API URL</Label>
        <Input
          id="api-url"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://your-api-endpoint.com/chat"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving || !apiUrl}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </Button>
        <Button onClick={handleTestConnection} disabled={isTesting || !apiUrl}>
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plug className="mr-2 h-4 w-4" />
          )}
          {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
        </Button>
      </div>
    </div>
  );
};

export default GeminiCustomSettings;