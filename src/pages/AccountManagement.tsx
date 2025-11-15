import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, Copy } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const newUserSchema = z.object({
  first_name: z.string().min(1, "Tên không được để trống."),
  last_name: z.string().optional(),
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  }
}

const fetchUsers = async (): Promise<AuthUser[]> => {
  const { data, error } = await supabase.functions.invoke('get-users');
  if (error) {
    const errorJson = await error.context.json();
    throw new Error(errorJson.error || `Failed to fetch users: ${error.message}`);
  }
  return data.users || [];
};

const AccountManagement = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: users, isLoading } = useQuery<AuthUser[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: NewUserFormValues) => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: values,
      });
      if (error) {
        const errorJson = await error.context.json();
        throw new Error(errorJson.error || 'Lỗi không xác định.');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Tạo tài khoản thành công!');
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const onSubmit = (values: NewUserFormValues) => {
    createUserMutation.mutate(values);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Đã sao chép ID người dùng!');
  };

  return (
    <div className="flex-1 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Tài khoản</h2>
          <p className="text-gray-500">Thêm và quản lý tài khoản người dùng cho hệ thống.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
              <DialogDescription>
                Người dùng mới sẽ có thể đăng nhập bằng email và mật khẩu này.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên</FormLabel>
                        <FormControl>
                          <Input placeholder="Văn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ</FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo tài khoản
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50 border-b">
              <TableHead className="font-semibold text-gray-600">Tên</TableHead>
              <TableHead className="font-semibold text-gray-600">Email</TableHead>
              <TableHead className="font-semibold text-gray-600">User ID</TableHead>
              <TableHead className="font-semibold text-gray-600">Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                </TableRow>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {`${user.user_metadata?.last_name || ''} ${user.user_metadata?.first_name || ''}`.trim()}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{user.id}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(user.id)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Không có tài khoản nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AccountManagement;