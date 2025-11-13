import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, UploadCloud, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { MediaItem } from '@/types/media';
import { Skeleton } from '@/components/ui/skeleton';
import ImageCard from '@/components/media/ImageCard';
import { Input } from '@/components/ui/input';

const fetchMedia = async () => {
  const { data, error } = await supabase
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const MediaLibrary = () => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media_library'],
    queryFn: fetchMedia,
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const filePath = `${user.id}/${Date.now()}-${fileToUpload.name}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('media_library')
        .upload(filePath, fileToUpload);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media_library')
        .getPublicUrl(filePath);
      if (!publicUrl) throw new Error("Could not get public URL");

      // 3. Insert into database
      const { error: dbError } = await supabase.from('media_library').insert({
        user_id: user.id,
        name: fileToUpload.name,
        url: publicUrl,
      });
      if (dbError) throw new Error(`Database Error: ${dbError.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media_library'] });
      showSuccess('Tải ảnh lên thành công!');
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        
        const filePath = item.url.split(`${user.id}/`)[1];
        if (!filePath) throw new Error("Invalid file path in URL");

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('media_library')
            .remove([`${user.id}/${filePath}`]);
        if (storageError) throw new Error(`Storage Error: ${storageError.message}`);

        // 2. Delete from database
        const { error: dbError } = await supabase.from('media_library').delete().eq('id', item.id);
        if (dbError) throw new Error(`Database Error: ${dbError.message}`);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['media_library'] });
        showSuccess('Đã xóa ảnh!');
    },
    onError: (error: Error) => {
        showError(`Lỗi: ${error.message}`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="flex-1 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Thư viện ảnh</h2>
          <p className="text-gray-500">Quản lý hình ảnh của bạn để sử dụng trong các cuộc trò chuyện.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/gif"
            className="max-w-xs"
          />
          <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            Tải lên
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      ) : media && media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <ImageCard key={item.id} item={item} onDelete={() => deleteMutation.mutate(item)} isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === item.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold">Thư viện của bạn trống</h3>
          <p className="text-gray-500 mt-1">Bắt đầu bằng cách tải lên hình ảnh đầu tiên.</p>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;