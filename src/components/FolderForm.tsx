import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { InboxFolder } from "@/types/inbox";

const formSchema = z.object({
  name: z.string().min(1, "Tên thư mục không được để trống."),
});

type FolderFormValues = z.infer<typeof formSchema>;

interface FolderFormProps {
  folder?: InboxFolder | null;
  onSubmit: (values: Pick<InboxFolder, 'name' | 'icon'>) => void;
  onClose: () => void;
  isPending: boolean;
}

export const FolderForm = ({ folder, onSubmit, onClose, isPending }: FolderFormProps) => {
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: folder?.name || "",
    },
  });

  const isEditing = !!folder;

  const handleFormSubmit = (values: FolderFormValues) => {
    onSubmit({ name: values.name, icon: 'Folder' });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Chỉnh sửa Thư mục" : "Tạo Thư mục Mới"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Thay đổi tên thư mục của bạn." : "Tạo một thư mục mới để sắp xếp hộp thư."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên Thư mục</FormLabel>
                <FormControl>
                  <Input placeholder="Ví dụ: Khách hàng VIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};