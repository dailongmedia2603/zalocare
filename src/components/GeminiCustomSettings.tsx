import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plug, Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const GeminiCustomSettings = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [testPrompt, setTestPrompt] = useState('Nguyễn Quang Hải là ai?');
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

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
    setConnectionStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-gemini-api', {
        body: { apiUrl },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        showSuccess('Kết nối thành công!');
        setConnectionStatus('success');
      } else {
        const errorMessage = data.details ? `${data.message}: ${data.details}` : data.message || 'Lỗi không xác định';
        showError(`Kết nối thất bại: ${errorMessage}`);
        setConnectionStatus('error');
      }
    } catch (error: any) {
      let detailedMessage = 'Lỗi không xác định. Vui lòng kiểm tra lại URL và cấu hình.';
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorJson = await error.context.json();
          detailedMessage = errorJson.details || errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          detailedMessage = error.message || 'Không thể phân tích phản hồi lỗi từ server.';
        }
      } else {
        detailedMessage = error.message || 'Edge Function returned a non-2xx status code.';
      }
      showError(`Kết nối thất bại: ${detailedMessage}`);
      setConnectionStatus('error');
      console.error('Function Invoke Error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendPrompt = async () => {
    if (!apiUrl) {
      showError('Vui lòng nhập URL API trước.');
      return;
    }
    if (!testPrompt) {
      showError('Vui lòng nhập nội dung để kiểm tra.');
      return;
    }
    setIsSendingPrompt(true);
    setTestResponse(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-gemini-api', {
        body: { apiUrl, prompt: testPrompt },
      });

      if (error) {
        throw error;
      }
      
      if (data.success === false) {
        const errorMessage = data.details ? `${data.message}: ${data.details}` : data.message || 'Lỗi không xác định';
        showError(`Gửi yêu cầu thất bại: ${errorMessage}`);
      }

      setTestResponse(data);
    } catch (error: any) {
      showError(`Lỗi khi gửi yêu cầu: ${error.message || 'Vui lòng kiểm tra lại.'}`);
      setTestResponse({ error: 'Gửi yêu cầu thất bại.', details: error.message });
      console.error('Prompt Test Error:', error);
    } finally {
      setIsSendingPrompt(false);
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
        <p className="text-xs text-gray-400">
          Lưu ý: Hệ thống sẽ tự động đính kèm token từ biến môi trường (secret) 
          <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">GEMINI_API_TOKEN</code> 
          khi gửi yêu cầu.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || !apiUrl} className="bg-orange-500 hover:bg-orange-600 text-white">
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
        {connectionStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Kết nối thành công</span>
          </div>
        )}
        {connectionStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Kết nối thất bại</span>
          </div>
        )}
      </div>

      <div className="pt-6 border-t">
        <h4 className="text-md font-semibold mb-2">Kiểm tra API</h4>
        <p className="text-sm text-gray-500 mb-4">
          Gửi một yêu cầu đến API của bạn để xem kết quả trả về.
        </p>
        <div className="space-y-2">
          <Label htmlFor="test-prompt">Nội dung</Label>
          <Textarea
            id="test-prompt"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Nhập nội dung bạn muốn gửi..."
            rows={4}
          />
        </div>
        <Button onClick={handleSendPrompt} disabled={isSendingPrompt || !testPrompt} className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
          {isSendingPrompt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSendingPrompt ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>

        {testResponse && (
          <div className="mt-4">
            <Label>Kết quả trả về</Label>
            <div className="mt-2 p-4 bg-gray-100 rounded-md text-sm overflow-auto max-h-60">
              <pre className="whitespace-pre-wrap break-words">
                <code>
                  {typeof testResponse === 'object' && testResponse !== null && testResponse.answer
                    ? testResponse.answer
                    : JSON.stringify(testResponse, null, 2)}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiCustomSettings;