import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2, icons, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { TagForm } from '@/components/tags/TagForm';
import { SourceForm } from '@/components/tags/SourceForm';
import { showSuccess, showError } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CustomerSource {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const fetchTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const fetchSources = async () => {
  const { data, error } = await supabase
    .from('customer_sources')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const Tags = () => {
  const queryClient = useQueryClient();

  // --- TAGS STATE & LOGIC ---
  const [isTagFormOpen, setIsTagFormOpen] = useState(false);
  const [isTagDeleteConfirmOpen, setIsTagDeleteConfirmOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { data: tags, isLoading: isLoadingTags } = useQuery<Tag[]>({ queryKey: ['tags'], queryFn: fetchTags });

  const addTagMutation = useMutation({
    mutationFn: async (newTag: Omit<Tag, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('tags').insert({ ...newTag, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      showSuccess('Đã tạo tag mới!');
      setIsTagFormOpen(false);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const updateTagMutation = useMutation({
    mutationFn: async (updatedTag: Tag) => {
      const { error } = await supabase.from('tags').update({ name: updatedTag.name, color: updatedTag.color, icon: updatedTag.icon }).eq('id', updatedTag.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      showSuccess('Đã cập nhật tag!');
      setIsTagFormOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', tagId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      showSuccess('Đã xóa tag!');
      setIsTagDeleteConfirmOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const handleTagFormSubmit = (values: Omit<Tag, 'id'>) => {
    if (selectedTag) {
      updateTagMutation.mutate({ ...values, id: selectedTag.id });
    } else {
      addTagMutation.mutate(values);
    }
  };

  // --- SOURCES STATE & LOGIC ---
  const [isSourceFormOpen, setIsSourceFormOpen] = useState(false);
  const [isSourceDeleteConfirmOpen, setIsSourceDeleteConfirmOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<CustomerSource | null>(null);
  const { data: sources, isLoading: isLoadingSources } = useQuery<CustomerSource[]>({ queryKey: ['customer_sources'], queryFn: fetchSources });

  const addSourceMutation = useMutation({
    mutationFn: async (newSource: Omit<CustomerSource, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('customer_sources').insert({ ...newSource, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_sources'] });
      showSuccess('Đã tạo nguồn mới!');
      setIsSourceFormOpen(false);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const updateSourceMutation = useMutation({
    mutationFn: async (updatedSource: CustomerSource) => {
      const { error } = await supabase.from('customer_sources').update({ name: updatedSource.name, color: updatedSource.color, icon: updatedSource.icon }).eq('id', updatedSource.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_sources'] });
      showSuccess('Đã cập nhật nguồn!');
      setIsSourceFormOpen(false);
      setSelectedSource(null);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const { error } = await supabase.from('customer_sources').delete().eq('id', sourceId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_sources'] });
      showSuccess('Đã xóa nguồn!');
      setIsSourceDeleteConfirmOpen(false);
      setSelectedSource(null);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const handleSourceFormSubmit = (values: Omit<CustomerSource, 'id'>) => {
    if (selectedSource) {
      updateSourceMutation.mutate({ ...values, id: selectedSource.id });
    } else {
      addSourceMutation.mutate(values);
    }
  };

  return (
    <div className="flex-1 p-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TAGS COLUMN */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Quản lý Tag</h2>
              <p className="text-gray-500">Tạo và quản lý các tag để phân loại khách hàng.</p>
            </div>
            <Dialog open={isTagFormOpen} onOpenChange={(open) => { if (!open) setSelectedTag(null); setIsTagFormOpen(open); }}>
              <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Thêm Tag</Button></DialogTrigger>
              <TagForm tag={selectedTag} onSubmit={handleTagFormSubmit} onClose={() => setIsTagFormOpen(false)} isPending={addTagMutation.isPending || updateTagMutation.isPending} />
            </Dialog>
          </div>
          {isLoadingTags ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : tags && tags.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tags.map((tag) => {
                const Icon = icons[tag.icon as keyof typeof icons] || icons['Tag'];
                return (
                  <div key={tag.id} className="p-4 rounded-lg border bg-white shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white", tag.color)}><Icon className="w-5 h-5" /></div><span className="font-semibold">{tag.name}</span></div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedTag(tag); setIsTagFormOpen(true); }}><Edit className="mr-2 h-4 w-4" /><span>Chỉnh sửa</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedTag(tag); setIsTagDeleteConfirmOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /><span>Xóa</span></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg"><h3 className="text-lg font-semibold">Chưa có tag nào</h3><p className="text-gray-500 mt-1">Bắt đầu bằng cách tạo tag đầu tiên.</p></div>
          )}
        </div>

        {/* SOURCES COLUMN */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Nguồn khách hàng</h2>
              <p className="text-gray-500">Quản lý các nguồn khách hàng của bạn.</p>
            </div>
            <Dialog open={isSourceFormOpen} onOpenChange={(open) => { if (!open) setSelectedSource(null); setIsSourceFormOpen(open); }}>
              <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Thêm Nguồn</Button></DialogTrigger>
              <SourceForm source={selectedSource} onSubmit={handleSourceFormSubmit} onClose={() => setIsSourceFormOpen(false)} isPending={addSourceMutation.isPending || updateSourceMutation.isPending} />
            </Dialog>
          </div>
          {isLoadingSources ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : sources && sources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sources.map((source) => (
                <div key={source.id} className="p-4 rounded-lg border bg-white shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white", source.color)}><Users className="w-5 h-5" /></div><span className="font-semibold">{source.name}</span></div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedSource(source); setIsSourceFormOpen(true); }}><Edit className="mr-2 h-4 w-4" /><span>Chỉnh sửa</span></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedSource(source); setIsSourceDeleteConfirmOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /><span>Xóa</span></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg"><h3 className="text-lg font-semibold">Chưa có nguồn nào</h3><p className="text-gray-500 mt-1">Bắt đầu bằng cách tạo nguồn đầu tiên.</p></div>
          )}
        </div>
      </div>

      {/* ALERT DIALOGS */}
      <AlertDialog open={isTagDeleteConfirmOpen} onOpenChange={setIsTagDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Tag "{selectedTag?.name}" sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setSelectedTag(null)}>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => selectedTag && deleteTagMutation.mutate(selectedTag.id)} disabled={deleteTagMutation.isPending} className="bg-red-600 hover:bg-red-700">{deleteTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isSourceDeleteConfirmOpen} onOpenChange={setIsSourceDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Nguồn "{selectedSource?.name}" sẽ bị xóa. Khách hàng thuộc nguồn này sẽ không còn được gán nữa.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setSelectedSource(null)}>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => selectedSource && deleteSourceMutation.mutate(selectedSource.id)} disabled={deleteSourceMutation.isPending} className="bg-red-600 hover:bg-red-700">{deleteSourceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tags;