import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plug, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const GeminiCustomSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('https://aquarius.qcv.vn/api/chat');

  const handleTestConnection = async () => {
    if (!apiUrl) {
      showError('Vui lòng nhập URL API.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          prompt: 'Nguyễn Quang Hải là ai ?',
        }),
      });

      if (response.ok) {
        showSuccess('Kết nối thành công!');
      } else {
        showError(`Kết nối thất bại: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      showError('Kết nối thất bại. Vui lòng kiểm tra lại URL và console.');
      console.error('Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cấu hình API Gemini Custom</h3>
        <p className="text-sm text-gray-500">
          Nhập URL API của bạn và kiểm tra kết nối để đảm bảo tích hợp thành công.
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
      <div>
        <Button onClick={handleTestConnection} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plug className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
        </Button>
      </div>
    </div>
  );
};

export default GeminiCustomSettings;