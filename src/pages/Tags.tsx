import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2, icons } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { TagForm } from '@/components/tags/TagForm';
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

const fetchTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const Tags = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

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
      setIsFormOpen(false);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async (updatedTag: Tag) => {
      const { error } = await supabase
        .from('tags')
        .update({ name: updatedTag.name, color: updatedTag.color, icon: updatedTag.icon })
        .eq('id', updatedTag.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      showSuccess('Đã cập nhật tag!');
      setIsFormOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', tagId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      showSuccess('Đã xóa tag!');
      setIsDeleteConfirmOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const handleFormSubmit = (values: Omit<Tag, 'id'>) => {
    if (selectedTag) {
      updateTagMutation.mutate({ ...values, id: selectedTag.id });
    } else {
      addTagMutation.mutate(values);
    }
  };

  const handleEditClick = (tag: Tag) => {
    setSelectedTag(tag);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteConfirmOpen(true);
  };

  const isMutationPending = addTagMutation.isPending || updateTagMutation.isPending;

  return (
    <div className="flex-1 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Tag</h2>
          <p className="text-gray-500">Tạo và quản lý các tag để phân loại khách hàng của bạn.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) setSelectedTag(null);
          setIsFormOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm Tag Mới
            </Button>
          </DialogTrigger>
          <TagForm
            tag={selectedTag}
            onSubmit={handleFormSubmit}
            onClose={() => setIsFormOpen(false)}
            isPending={isMutationPending}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags.map((tag) => {
            const Icon = icons[tag.icon as keyof typeof icons] || icons['Tag'];
            return (
              <div key={tag.id} className="p-4 rounded-lg border bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white", tag.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{tag.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(tag)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Chỉnh sửa</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(tag)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Xóa</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold">Chưa có tag nào</h3>
          <p className="text-gray-500 mt-1">Bắt đầu bằng cách tạo tag đầu tiên của bạn.</p>
        </div>
      )}

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tag "{selectedTag?.name}" sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTag(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTag && deleteTagMutation.mutate(selectedTag.id)}
              disabled={deleteTagMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tags;