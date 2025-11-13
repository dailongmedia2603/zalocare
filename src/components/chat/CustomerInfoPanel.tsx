import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ConversationInboxItem } from '@/types/chat';
import { Mail, Phone, PlusCircle, X, Loader2, icons } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/pages/Tags';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

// Fetch all available tags for the user
const useAvailableTags = () => {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

interface CustomerInfoPanelProps {
  conversation: ConversationInboxItem | null;
}

const CustomerInfoPanel = ({ conversation }: CustomerInfoPanelProps) => {
  const queryClient = useQueryClient();
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const { data: availableTags, isLoading: isLoadingTags } = useAvailableTags();

  const customerId = conversation?.customer?.id;

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !customerId) throw new Error("User or customer not found");
      const { error } = await supabase.from('customer_tags').insert({
        customer_id: customerId,
        tag_id: tagId,
        user_id: user.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      showSuccess("Đã thêm tag!");
    },
    onError: (error) => showError(error.message),
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!customerId) throw new Error("Customer not found");
      const { error } = await supabase.from('customer_tags')
        .delete()
        .eq('customer_id', customerId)
        .eq('tag_id', tagId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      showSuccess("Đã xóa tag!");
    },
    onError: (error) => showError(error.message),
  });

  if (!conversation) {
    return <div className="w-[360px] border-l bg-gray-50"></div>;
  }

  // Handle case where customer record might not exist yet
  if (!conversation.customer) {
    return (
      <div className="w-[360px] border-l flex flex-col items-center justify-center p-4 text-center">
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src={'/placeholder.svg'} />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <h3 className="mt-3 font-bold text-lg">Khách hàng mới</h3>
        <p className="text-sm text-gray-500">Thông tin chi tiết sẽ được cập nhật sau.</p>
      </div>
    );
  }

  const { customer, tags: assignedTags } = conversation;
  const customerName = customer.display_name || 'Unknown User';

  const unassignedTags = availableTags?.filter(
    (at) => !assignedTags.some((st) => st.id === at.id)
  );

  return (
    <div className="w-[360px] border-l flex flex-col">
      <div className="p-4 text-center border-b">
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src={customer.avatar_url || '/placeholder.svg'} />
          <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="mt-3 font-bold text-lg">{customerName}</h3>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Thông tin liên hệ</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>Chưa có email</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>Chưa có SĐT</span>
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-600">Tags</h4>
            <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Thêm
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[220px]" align="end">
                <Command>
                  <CommandInput placeholder="Tìm kiếm tag..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy tag.</CommandEmpty>
                    <CommandGroup>
                      {isLoadingTags ? (
                        <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : (
                        unassignedTags?.map((tag) => {
                          const Icon = icons[tag.icon as keyof typeof icons] || icons['Tag'];
                          return (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => {
                                addTagMutation.mutate(tag.id);
                                setIsTagPopoverOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-white", tag.color)}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span>{tag.name}</span>
                              </div>
                            </CommandItem>
                          );
                        })
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-2">
            {assignedTags.map((tag) => {
              const Icon = icons[tag.icon as keyof typeof icons] || icons['Tag'];
              return (
                <Badge key={tag.id} variant="secondary" className={cn("py-1 pl-2 pr-1 gap-1.5", tag.color, "text-white")}>
                  <Icon className="w-3 h-3" />
                  {tag.name}
                  <button
                    onClick={() => removeTagMutation.mutate(tag.id)}
                    className="rounded-full hover:bg-black/20 p-0.5"
                    disabled={removeTagMutation.isPending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Ghi chú</h4>
          <Textarea placeholder="Thêm ghi chú về khách hàng..." rows={5} />
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoPanel;