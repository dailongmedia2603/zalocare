import { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MoreHorizontal, ArrowUpDown, Users, UserPlus, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Define the customer type based on the database schema
interface Customer {
  id: string;
  zalo_id: string;
  display_name: string | null;
  zalo_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// Hook to fetch customers with pagination
const useCustomers = (page: number, pageSize: number) => {
  return useQuery<{ customers: Customer[], count: number }, Error>({
    queryKey: ['customers', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(error.message);
      }
      
      return { customers: data || [], count: count || 0 };
    },
  });
};


const Customers = () => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 7; // Number of items per page, similar to the image

  const { data, isLoading, isError } = useCustomers(page, pageSize);

  // Real-time subscription for the customers table
  useEffect(() => {
    const channel = supabase
      .channel('realtime-customers-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          // Invalidate the query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const customers = data?.customers || [];
  const totalCustomers = data?.count || 0;
  const totalPages = Math.ceil(totalCustomers / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const renderPagination = () => {
    // Simplified pagination logic for brevity
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
        <Tabs defaultValue="all">
          <TabsList className="bg-transparent p-0 h-auto space-x-4">
            <TabsTrigger value="all" className="flex items-center gap-2 text-gray-500 text-base data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-gray-900 font-semibold rounded-none pb-2 px-1">
              <Users className="w-4 h-4" />
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2 text-gray-500 text-base data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-gray-900 font-semibold rounded-none pb-2 px-1">
              <UserPlus className="w-4 h-4" />
              Mới
            </TabsTrigger>
            <TabsTrigger value="contacted" className="flex items-center gap-2 text-gray-500 text-base data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-gray-900 font-semibold rounded-none pb-2 px-1">
              <MessageSquare className="w-4 h-4" />
              Đã liên hệ
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal bg-white",
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
                  <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
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
                  <TableCell className="text-gray-500">{format(new Date(customer.created_at), "dd MMM, yyyy")}</TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Mở menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                        <DropdownMenuItem>Gửi tin nhắn</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50">Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        <Pagination>
          {renderPagination()}
        </Pagination>
      </div>
    </div>
  );
};

export default Customers;