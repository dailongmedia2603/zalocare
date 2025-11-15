import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2, Folder as FolderIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { FolderForm } from '@/components/settings/FolderForm';
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
import { InboxFolder } from '@/types/inbox';

const fetchFolders = async () => {
  const { data, error } = await supabase
    .from('inbox_folders')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const InboxFoldersSettings = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<InboxFolder | null>(null);

  const { data: folders, isLoading } = useQuery<InboxFolder[]>({
    queryKey: ['inbox_folders'],
    queryFn: fetchFolders,
  });

  const addFolderMutation = useMutation({
    mutationFn: async (newFolder: Pick<InboxFolder, 'name' | 'icon'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('inbox_folders').insert({ ...newFolder, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox_folders'] });
      showSuccess('Đã tạo thư mục mới!');
      setIsFormOpen(false);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async (updatedFolder: Pick<InboxFolder, 'id' | 'name' | 'icon'>) => {
      const { error } = await supabase
        .from('inbox_folders')
        .update({ name: updatedFolder.name, icon: updatedFolder.icon })
        .eq('id', updatedFolder.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox_folders'] });
      showSuccess('Đã cập nhật thư mục!');
      setIsFormOpen(false);
      setSelectedFolder(null);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase.from('inbox_folders').delete().eq('id', folderId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox_folders'] });
      showSuccess('Đã xóa thư mục!');
      setIsDeleteConfirmOpen(false);
      setSelectedFolder(null);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const handleFormSubmit = (values: Pick<InboxFolder, 'name' | 'icon'>) => {
    if (selectedFolder) {
      updateFolderMutation.mutate({ ...values, id: selectedFolder.id });
    } else {
      addFolderMutation.mutate(values);
    }
  };

  const handleEditClick = (folder: InboxFolder) => {
    setSelectedFolder(folder);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (folder: InboxFolder) => {
    setSelectedFolder(folder);
    setIsDeleteConfirmOpen(true);
  };

  const isMutationPending = addFolderMutation.isPending || updateFolderMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold mb-2">Quản lý Thư mục Hộp thư</h3>
          <p className="text-sm text-gray-500">
            Tạo và quản lý các thư mục để phân loại cuộc trò chuyện của bạn.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) setSelectedFolder(null);
          setIsFormOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm Thư mục
            </Button>
          </DialogTrigger>
          <FolderForm
            folder={selectedFolder}
            onSubmit={handleFormSubmit}
            onClose={() => setIsFormOpen(false)}
            isPending={isMutationPending}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : folders && folders.length > 0 ? (
        <div className="border rounded-lg">
          {folders.map((folder) => (
            <div key={folder.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderIcon className="w-5 h-5 text-gray-500" />
                <span className="font-semibold">{folder.name}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(folder)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Chỉnh sửa</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(folder)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Xóa</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold">Chưa có thư mục nào</h3>
          <p className="text-gray-500 mt-1">Bắt đầu bằng cách tạo thư mục đầu tiên của bạn.</p>
        </div>
      )}

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thư mục "{selectedFolder?.name}" sẽ bị xóa. Các cuộc trò chuyện trong thư mục này sẽ được chuyển về hộp thư gốc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFolder(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFolder && deleteFolderMutation.mutate(selectedFolder.id)}
              disabled={deleteFolderMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteFolderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InboxFoldersSettings;