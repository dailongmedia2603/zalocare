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
import { Calendar as CalendarIcon, ArrowUpDown, Users, UserPlus, MessageSquare, Trash2, Loader2, Search } from "lucide-react";
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

interface Customer {
  id: string;
  zalo_id: string;
  display_name: string | null;
  zalo_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const useCustomers = (page: number, pageSize: number, filters: {
  dateRange?: DateRange;
  searchTerm: string;
  selectedTagIds: string[];
}) => {
  const { dateRange, searchTerm, selectedTagIds } = filters;

  return useQuery<{ customers: Customer[], count: number }, Error>({
    queryKey: ['customers', page, pageSize, dateRange, searchTerm, selectedTagIds],
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
        p_start_date: dateRange?.from?.toISOString() || null,
        p_end_date: toDate?.toISOString() || null,
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

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [date, debouncedSearchTerm, selectedTagIds, pageSize]);

  const { data, isLoading, isError } = useCustomers(page, pageSize, {
    dateRange: date,
    searchTerm: debouncedSearchTerm,
    selectedTagIds,
  });

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

  const handleSendMessage = (customer: Customer) => {
    navigate('/', { state: { selectedConversationId: customer.zalo_id } });
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const customers = data?.customers || [];
  const totalCustomers = data?.count || 0;
  const totalPages = Math.ceil(totalCustomers / pageSize);

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
    <div className="flex-1 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white w-64 h-9"
            />
          </div>
          <TagFilter selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
        </div>
        <div className="flex items-center gap-2">
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

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50 border-b">
              <TableHead className="pl-6">
                <Button variant="ghost" size="sm" className="font-semibold text-gray-600 -ml-4">
                  Tên
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="font-semibold text-gray-600 -ml-4">
                  Ngày tạo
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right pr-6 font-semibold text-gray-600">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(pageSize)].map((_, i) => (
                <TableRow key={i} className="border-b-0">
                  <TableCell className="pl-6"><Skeleton className="h-8 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-red-500 h-48">
                  Lỗi khi tải dữ liệu khách hàng.
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 h-48">
                  Không có khách hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50">
                  <TableCell className="pl-6">
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
                  <TableCell className="text-gray-500">{format(new Date(customer.created_at), "dd/MM/yyyy")}</TableCell>
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