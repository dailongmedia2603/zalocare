import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Save, Wand2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

// Schema for form validation
const promptSchema = z.object({
  prompt_text: z.string().min(10, { message: 'Prompt phải có ít nhất 10 ký tự.' }),
});

type PromptFormValues = z.infer<typeof promptSchema>;

// Function to fetch the user's prompt config
const fetchPromptConfig = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('prompt_configs')
    .select('prompt_text')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
    throw new Error(error.message);
  }

  return data;
};

const PromptConfig = () => {
  const queryClient = useQueryClient();

  // Fetching data
  const { data: promptConfig, isLoading } = useQuery({
    queryKey: ['promptConfig'],
    queryFn: fetchPromptConfig,
  });

  // Form setup
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt_text: '',
    },
  });

  // Update form with fetched data
  useEffect(() => {
    if (promptConfig) {
      form.reset({ prompt_text: promptConfig.prompt_text || '' });
    }
  }, [promptConfig, form]);

  // Mutation for saving data
  const saveMutation = useMutation({
    mutationFn: async (values: PromptFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('prompt_configs')
        .upsert({
          user_id: user.id,
          prompt_text: values.prompt_text,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Đã lưu cấu hình prompt!');
      queryClient.invalidateQueries({ queryKey: ['promptConfig'] });
    },
    onError: (error: Error) => {
      showError(`Lỗi khi lưu: ${error.message}`);
    },
  });

  const onSubmit = (values: PromptFormValues) => {
    saveMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 w-full">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Wand2 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Cấu hình Prompt</CardTitle>
                  <CardDescription>
                    Thiết lập mẫu prompt để AI tự động tạo nội dung chăm sóc khách hàng.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="prompt_text"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="prompt-text" className="text-base font-semibold">Mẫu Prompt</Label>
                    <FormControl>
                      <Textarea
                        id="prompt-text"
                        rows={15}
                        placeholder="Nhập mẫu prompt của bạn ở đây..."
                        className="mt-2 text-base leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-2">
                      Sử dụng biến động <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">{'{{MESSAGE_HISTORY}}'}</code> để chèn toàn bộ lịch sử trò chuyện vào prompt.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default PromptConfig;