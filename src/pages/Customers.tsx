import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, ArrowUpDown, MessageSquare, Trash2, Loader2, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError } from '@/utils/toast';
import { TagFilter } from '@/components/customers/TagFilter';
import { SourceFilter } from '@/components/customers/SourceFilter';
import { Tag, CustomerSource } from '@/pages/Tags';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkTagAssigner } from '@/components/customers/BulkTagAssigner';

interface Customer {
  id: string;
  zalo_id: string;
  display_name: string | null;
  zalo_name: string | null;
  avatar_url: string | null;
  created_at: string;
  tags: Tag[];
  source: CustomerSource | null;
  ai_cskh_enabled: boolean;
  scheduled_messages_count: number;
}

const useCustomers = (page: number, pageSize: number, filters: {
  dateRange?: DateRange;
  searchTerm: string;
  selectedTagIds: string[];
  selectedSourceIds: string[];
  aiCskhStatus: 'all' | 'enabled' | 'disabled';
}) => {
  const { dateRange, searchTerm, selectedTagIds, selectedSourceIds, aiCskhStatus } = filters;

  return useQuery<{ customers: Customer[], count: number }, Error>({
    queryKey: ['customers', page, pageSize, dateRange, searchTerm, selectedTagIds, selectedSourceIds, aiCskhStatus],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { customers: [], count: 0 };

      const from = (page - 1) * pageSize;
      
      const toDate = dateRange?.to ? new Date(dateRange.to) : undefined;
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }

      const rpcParams = {
        p_user_id: user.id,
        p_search_term: searchTerm || null,
        p_tag_ids: selectedTagIds.length > 0 ? selectedTagIds : null,
        p_source_ids: selectedSourceIds.length > 0 ? selectedSourceIds : null,
        p_start_date: dateRange?.from?.toISOString() || null,
        p_end_date: toDate?.toISOString() || null,
        p_ai_cskh_status: aiCskhStatus === 'all' ? null : aiCskhStatus === 'enabled',
      };

      const [customersResult, countResult] = await Promise.all([
        supabase.rpc('get_filtered_customers_list', {
          ...rpcParams,
          p_limit: pageSize,
          p_offset: from,
        }),
        supabase.rpc('get_filtered_customers_count', rpcParams)
      ]);

      if (customersResult.error) throw new Error(customersResult.error.message);
      if (countResult.error) throw new Error(countResult.error.message);

      return { customers: customersResult.data || [], count: countResult.data || 0 };
    },
  });
};

const Customers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [aiCskhStatus, setAiCskhStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page and selection on filter change
  useEffect(() => {
    setPage(1);
    setSelectedCustomerIds([]);
  }, [date, debouncedSearchTerm, selectedTagIds, selectedSourceIds, pageSize, aiCskhStatus]);

  const { data, isLoading, isError } = useCustomers(page, pageSize, {
    dateRange: date,
    searchTerm: debouncedSearchTerm,
    selectedTagIds,
    selectedSourceIds,
    aiCskhStatus,
  });

  const customers = data?.customers || [];
  const totalCustomers = data?.count || 0;
  const totalPages = Math.ceil(totalCustomers / pageSize);

  useEffect(() => {
    // Clear selection if customers data changes (e.g., due to pagination)
    setSelectedCustomerIds([]);
  }, [data?.customers]);

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showSuccess('Đã xóa khách hàng!');
      setCustomerToDelete(null);
    },
    onError: (error: Error) => {
      showError(`Lỗi khi xóa: ${error.message}`);
      setCustomerToDelete(null);
    },
  });

  const updateAiStatusMutation = useMutation({
    mutationFn: async ({ customerId, enabled }: { customerId: string, enabled: boolean }) => {
      const { error } = await supabase
        .from('customers')
        .update({ ai_cskh_enabled: enabled })
        .eq('id', customerId);
      if (error) throw new Error(error.message);
      return { customerId, enabled };
    },
    onSuccess: ({ customerId, enabled }) => {
      queryClient.setQueryData(['customers', page, pageSize, date, debouncedSearchTerm, selectedTagIds, selectedSourceIds, aiCskhStatus], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          customers: oldData.customers.map((c: Customer) =>
            c.id === customerId ? { ...c, ai_cskh_enabled: enabled } : c
          ),
        };
      });
      showSuccess(`Đã ${enabled ? 'bật' : 'tắt'} AI CSKH.`);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleSendMessage = (customer: Customer) => {
    navigate('/', { state: { selectedConversationId: customer.zalo_id } });
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (value: string) => {
    if (value === 'all') {
      setPageSize(totalCustomers > 0 ? totalCustomers : 9999);
    } else {
      setPageSize(Number(value));
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }} />
        </PaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }} />
        </PaginationItem>
      </PaginationContent>
    );
  };

  return (
    <div className="flex-1 p-6 w-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white w-64 h-9"
            />
          </div>
          <TagFilter selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
          <SourceFilter selectedSourceIds={selectedSourceIds} onChange={setSelectedSourceIds} />
          <Select value={aiCskhStatus} onValueChange={(value) => setAiCskhStatus(value as any)}>
            <SelectTrigger className="w-[180px] bg-white h-9">
              <SelectValue placeholder="Trạng thái AI CSKH" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả AI CSKH</SelectItem>
              <SelectItem value="enabled">Đã bật</SelectItem>
              <SelectItem value="disabled">Đã tắt</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal bg-white h-9",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM/yyyy")} -{" "}
                      {format(date.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(date.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {selectedCustomerIds.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-sm font-semibold text-orange-700">
            Đã chọn {selectedCustomerIds.length} khách hàng
          </span>
          <BulkTagAssigner 
            selectedCustomerIds={selectedCustomerIds}
            onSuccess={() => setSelectedCustomerIds([])}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50 border-b">
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={selectedCustomerIds.length > 0 && selectedCustomerIds.length === customers.length}
                    onCheckedChange={(checked) => {
                      setSelectedCustomerIds(checked ? customers.map(c => c.id) : []);
                    }}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[25%]">
                  <Button variant="ghost" size="sm" className="font-semibold text-gray-600 -ml-4">
                    Tên
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-600 w-[15%]">Nguồn</TableHead>
                <TableHead className="font-semibold text-gray-600 w-[15%]">Tags</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="font-semibold text-gray-600 -ml-4">
                    Ngày tạo
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-600">AI CSKH</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Lịch chăm sóc</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-gray-600">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(pageSize)].map((_, i) => (
                  <TableRow key={i} className="border-b-0">
                    <TableCell className="pl-4"><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-5 mx-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-red-500 h-48">
                    Lỗi khi tải dữ liệu khách hàng.
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 h-48">
                    Không có khách hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50" data-state={selectedCustomerIds.includes(customer.id) && "selected"}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedCustomerIds.includes(customer.id)}
                        onCheckedChange={(checked) => {
                          setSelectedCustomerIds(
                            checked
                              ? [...selectedCustomerIds, customer.id]
                              : selectedCustomerIds.filter((id) => id !== customer.id)
                          );
                        }}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={customer.avatar_url || '/placeholder.svg'} alt={customer.display_name || 'C'} />
                          <AvatarFallback>{(customer.display_name || 'C').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-800">{customer.display_name || 'Chưa có tên'}</div>
                          {customer.zalo_name && (
                            <div className="text-sm text-gray-500 italic">{customer.zalo_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.source && (
                        <Badge className={cn("py-0.5 px-1.5 text-xs border-transparent", customer.source.color, "text-white")}>
                          <Users className="w-2.5 h-2.5 mr-1" />
                          {customer.source.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {customer.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} className={cn("py-0.5 px-1.5 text-xs border-transparent", tag.color, "text-white")}>
                            {tag.name}
                          </Badge>
                        ))}
                        {customer.tags?.length > 2 && (
                          <Badge variant="secondary" className="py-0.5 px-1.5 text-xs">
                            +{customer.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{format(new Date(customer.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Switch
                        checked={customer.ai_cskh_enabled}
                        onCheckedChange={(checked) => {
                          updateAiStatusMutation.mutate({ customerId: customer.id, enabled: checked });
                        }}
                        disabled={updateAiStatusMutation.isPending && updateAiStatusMutation.variables?.customerId === customer.id}
                      />
                    </TableCell>
                    <TableCell className="text-center font-medium text-gray-700">
                      {customer.scheduled_messages_count}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendMessage(customer)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(customer)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">
          Hiển thị {Math.min((page - 1) * pageSize + 1, totalCustomers)}-{Math.min(page * pageSize, totalCustomers)} trên {totalCustomers} khách hàng
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Số lượng:</span>
            <Select
              value={pageSize >= totalCustomers && totalCustomers > 0 ? 'all' : String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue placeholder="Số lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            {pageSize < totalCustomers && renderPagination()}
          </Pagination>
        </div>
      </div>

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Khách hàng "{customerToDelete?.display_name}" sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => customerToDelete && deleteCustomerMutation.mutate(customerToDelete.id)}
              disabled={deleteCustomerMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCustomerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;