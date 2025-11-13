import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MediaItem } from '@/types/media';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

interface ImageSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (url: string) => void;
}

const fetchMedia = async () => {
  const { data, error } = await supabase
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const ImageSelectorDialog = ({ open, onOpenChange, onSelectImage }: ImageSelectorDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: media, isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media_library'],
    queryFn: fetchMedia,
    enabled: open, // Only fetch when the dialog is open
  });

  const filteredMedia = media?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn ảnh từ thư viện</DialogTitle>
          <DialogDescription>Nhấp vào một ảnh để chọn và gửi đi.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm ảnh..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : filteredMedia && filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="relative group aspect-square cursor-pointer"
                  onClick={() => onSelectImage(item.url)}
                >
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded-lg border" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-2">
                    <div className="text-white text-xs font-semibold truncate">{item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold">Không tìm thấy ảnh</h3>
              <p className="text-gray-500 mt-1">Thư viện của bạn trống hoặc không có ảnh nào khớp với tìm kiếm.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSelectorDialog;