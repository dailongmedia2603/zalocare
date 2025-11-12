import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const ZaloConnectionSettings = () => {
  const [zaloOaId, setZaloOaId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('zalo_oa_id')
          .eq('id', user.id)
          .single();

        if (data && data.zalo_oa_id) {
          setZaloOaId(data.zalo_oa_id);
        }
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          showError('Không thể tải thông tin kết nối.');
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      showError('Không tìm thấy thông tin người dùng.');
      return;
    }
    if (!zaloOaId) {
      showError('Vui lòng nhập Zalo OA ID.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ zalo_oa_id: zaloOaId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      showError('Lưu kết nối thất bại.');
      console.error('Error saving Zalo connection:', error);
    } else {
      showSuccess('Đã lưu kết nối Zalo!');
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
        <h3 className="text-lg font-semibold mb-2">Kết nối Zalo Official Account</h3>
        <p className="text-sm text-gray-500">
          Nhập ID của Zalo OA để hệ thống có thể nhận và xử lý tin nhắn của bạn.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="zalo-oa-id">Zalo OA ID</Label>
        <Input
          id="zalo-oa-id"
          value={zaloOaId}
          onChange={(e) => setZaloOaId(e.target.value)}
          placeholder="Nhập ID của Zalo Official Account..."
        />
        <p className="text-xs text-gray-400">Bạn có thể tìm thấy ID này trong trang quản trị Zalo OA của bạn.</p>
      </div>
      <Button onClick={handleSave} disabled={isSaving || !zaloOaId}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {isSaving ? 'Đang lưu...' : 'Lưu kết nối'}
      </Button>
    </div>
  );
};

export default ZaloConnectionSettings;