import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from "../ui/skeleton";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "../ui/scroll-area";

interface AiPromptLog {
  id: string;
  created_at: string;
  status: 'success' | 'failed';
  error_message: string | null;
  prompt_sent: string;
  raw_response: string;
}

const useAiLogs = (customerId: string) => {
  return useQuery<AiPromptLog[]>({
    queryKey: ['aiPromptLogs', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to last 10 logs for performance
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

interface AiLogsDialogProps {
  customerId: string;
}

export const AiLogsDialog = ({ customerId }: AiLogsDialogProps) => {
  const { data: logs, isLoading } = useAiLogs(customerId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Lịch sử AI CSKH</DialogTitle>
          <DialogDescription>
            Xem lại các lần AI được kích hoạt để tạo lịch chăm sóc cho khách hàng này.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
            ) : logs && logs.length > 0 ? (
              logs.map(log => (
                <Collapsible key={log.id} className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={log.status === 'success' ? 'bg-green-500' : ''}>
                          {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      {log.status === 'failed' && log.error_message && (
                        <p className="text-xs text-red-600 mt-2 flex items-start gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span className="break-all">{log.error_message}</span>
                        </p>
                      )}
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">Xem chi tiết</Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-3 pt-3 border-t">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Prompt đã gửi</h4>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono p-2 bg-white rounded-md border max-h-60 overflow-y-auto">
                          {log.prompt_sent}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Phản hồi từ AI</h4>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono p-2 bg-white rounded-md border max-h-60 overflow-y-auto">
                          {log.raw_response}
                        </pre>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <div className="text-center py-16 text-gray-500">
                Chưa có lịch sử nào.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};