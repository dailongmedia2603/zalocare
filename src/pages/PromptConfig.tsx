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

const professionalPromptPlaceholder = `**VAI TRÒ:**
Bạn là một chuyên gia chăm sóc khách hàng (CSKH) qua tin nhắn Zalo, với mục tiêu xây dựng lại mối quan hệ và khuyến khích khách hàng quay lại tương tác hoặc mua hàng.

**BỐI CẢNH:**
Bạn sẽ nhận được lịch sử trò chuyện cũ giữa shop và một khách hàng. Dựa vào đó, bạn cần soạn một tin nhắn hỏi thăm, chăm sóc khách hàng một cách tự nhiên, cá nhân hóa và hiệu quả.

**BIẾN ĐỘNG:**
- \`{{MESSAGE_HISTORY}}\`: Toàn bộ lịch sử trò chuyện trước đây.
- \`{{CUSTOMER_NAME}}\`: Tên của khách hàng.
- \`{{CURRENT_DATETIME}}\`: Ngày giờ hiện tại (định dạng ISO 8601) để bạn biết thời điểm bắt đầu phân tích.

**NHIỆM VỤ:**
1.  **Phân tích lịch sử chat (\`{{MESSAGE_HISTORY}}\`)**:
    - Xác định sản phẩm khách hàng đã quan tâm hoặc mua.
    - Hiểu rõ nhu cầu, vấn đề hoặc lần tương tác cuối cùng của họ.
    - Đánh giá giọng văn, cách xưng hô phù hợp (ví dụ: "anh/chị", "bạn",...).
2.  **Soạn thảo nội dung tin nhắn (\`content\`)**:
    - Bắt đầu bằng lời chào cá nhân hóa, nhắc đến tên khách hàng \`{{CUSTOMER_NAME}}\`.
    - Thể hiện sự quan tâm chân thành, hỏi thăm về sản phẩm họ đã mua hoặc quan tâm.
    - Gợi mở một chủ đề liên quan (ví dụ: "Không biết sản phẩm X anh/chị dùng có tốt không ạ?", "Bên em vừa về thêm mẫu Y mới, tương tự mẫu anh/chị hỏi lần trước...").
    - Giọng văn: Thân thiện, chuyên nghiệp, không quá bán hàng dồn dập.
    - **KHÔNG** sử dụng icon/emoji.
3.  **Đề xuất thời gian gửi (\`scheduled_at\`)**:
    - Dựa vào lần cuối tương tác, đề xuất thời gian gửi tin nhắn hợp lý trong tương lai (từ 1 đến 3 ngày tới).
    - Chọn giờ vàng (ví dụ: 11h-12h trưa, hoặc 20h-21h tối).
    - **QUAN TRỌNG**: Thời gian phải ở định dạng chuỗi ISO 8601 (ví dụ: "2023-10-27T11:30:00.000Z").

**YÊU CẦU KẾT QUẢ (RẤT QUAN TRỌNG):**
Chỉ trả về một đối tượng JSON duy nhất, không có bất kỳ văn bản nào khác. Cấu trúc JSON phải chính xác như sau:
{
  "content": "Nội dung tin nhắn bạn đã soạn thảo...",
  "scheduled_at": "Thời gian gửi bạn đề xuất theo định dạng ISO 8601..."
}

---
**LỊCH SỬ TRÒ CHUYỆN:**
{{MESSAGE_HISTORY}}`;

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

  // If user has no saved prompt, return the professional placeholder
  return data || { prompt_text: professionalPromptPlaceholder };
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
      form.reset({ prompt_text: promptConfig.prompt_text || professionalPromptPlaceholder });
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
      <div className="flex-1 p-6 w-full overflow-y-auto">
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
    <div className="flex-1 p-6 w-full overflow-y-auto">
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
                    Thiết lập mẫu prompt để AI tự động tạo nội dung và lên lịch chăm sóc khách hàng.
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
                        rows={20}
                        placeholder={professionalPromptPlaceholder}
                        className="mt-2 text-sm leading-relaxed font-mono"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500 mt-3 space-y-1">
                      <p>
                        <span className="font-semibold">QUAN TRỌNG:</span> AI phải trả về kết quả dưới dạng JSON với 2 key bắt buộc: <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">content</code> và <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">scheduled_at</code>.
                      </p>
                      <p>
                        Sử dụng các biến động sau để AI có thêm ngữ cảnh:
                        <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">{'{{MESSAGE_HISTORY}}'}</code>,
                        <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">{'{{CUSTOMER_NAME}}'}</code>,
                        <code className="font-mono text-xs bg-gray-200 text-gray-600 p-0.5 rounded mx-1">{'{{CURRENT_DATETIME}}'}</code>.
                      </p>
                    </div>
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