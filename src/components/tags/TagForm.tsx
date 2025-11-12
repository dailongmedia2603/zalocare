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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Tag } from "@/pages/Tags";

const PRESET_COLORS = [
  { name: "Gray", class: "bg-gray-500" },
  { name: "Red", class: "bg-red-500" },
  { name: "Orange", class: "bg-orange-500" },
  { name: "Amber", class: "bg-amber-500" },
  { name: "Yellow", class: "bg-yellow-500" },
  { name: "Lime", class: "bg-lime-500" },
  { name: "Green", class: "bg-green-500" },
  { name: "Emerald", class: "bg-emerald-500" },
  { name: "Teal", class: "bg-teal-500" },
  { name: "Cyan", class: "bg-cyan-500" },
  { name: "Sky", class: "bg-sky-500" },
  { name: "Blue", class: "bg-blue-500" },
  { name: "Indigo", class: "bg-indigo-500" },
  { name: "Violet", class: "bg-violet-500" },
  { name: "Purple", class: "bg-purple-500" },
  { name: "Fuchsia", class: "bg-fuchsia-500" },
  { name: "Pink", class: "bg-pink-500" },
  { name: "Rose", class: "bg-rose-500" },
];

const formSchema = z.object({
  name: z.string().min(1, "Tên tag không được để trống."),
  color: z.string().min(1, "Vui lòng chọn một màu."),
});

type TagFormValues = z.infer<typeof formSchema>;

interface TagFormProps {
  tag?: Tag | null;
  onSubmit: (values: Omit<Tag, 'id'>) => void;
  onClose: () => void;
  isPending: boolean;
}

export const TagForm = ({ tag, onSubmit, onClose, isPending }: TagFormProps) => {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tag?.name || "",
      color: tag?.color || "bg-gray-500",
    },
  });

  const isEditing = !!tag;

  const handleFormSubmit = (values: TagFormValues) => {
    // Always use 'Tag' as the icon
    onSubmit({ name: values.name, color: values.color, icon: 'Tag' });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Chỉnh sửa Tag" : "Tạo Tag Mới"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Thay đổi thông tin tag của bạn." : "Tạo một tag mới để phân loại khách hàng."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên Tag</FormLabel>
                <FormControl>
                  <Input placeholder="Ví dụ: Khách hàng tiềm năng" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Màu sắc</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-6 gap-2"
                  >
                    {PRESET_COLORS.map((color) => (
                      <FormItem key={color.class} className="flex items-center justify-center">
                        <FormControl>
                          <RadioGroupItem value={color.class} className="sr-only" />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "w-10 h-10 rounded-full cursor-pointer border-2 border-transparent",
                            color.class,
                            field.value === color.class && "ring-2 ring-offset-2 ring-primary"
                          )}
                        />
                      </FormItem>
                    ))}
                  </RadioGroup>
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