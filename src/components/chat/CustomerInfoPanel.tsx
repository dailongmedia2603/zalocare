import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ConversationInboxItem, CustomerNote } from '@/types/chat';
import { Mail, Phone, PlusCircle, X, Loader2, icons, Tag as TagIcon, Notebook } from 'lucide-react';
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
import NoteItem from './NoteItem';
import { Skeleton } from '../ui/skeleton';

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

// Fetch notes for a specific customer
const useNotes = (customerId: string | null) => {
  return useQuery<CustomerNote[]>({
    queryKey: ['notes', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!customerId,
  });
};

interface CustomerInfoPanelProps {
  conversation: ConversationInboxItem | null;
}

const CustomerInfoPanel = ({ conversation }: CustomerInfoPanelProps) => {
  const queryClient = useQueryClient();
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { data: availableTags, isLoading: isLoadingTags } = useAvailableTags();

  const customerId = conversation?.customer?.id;

  const { data: notes, isLoading: isLoadingNotes } = useNotes(customerId || null);

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

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !customerId) throw new Error("User or customer not found");
      const { error } = await supabase.from('notes').insert({
        customer_id: customerId,
        user_id: user.id,
        content: content,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', customerId] });
      setNewNote('');
      showSuccess("Đã thêm ghi chú!");
    },
    onError: (error) => showError(error.message),
  });

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newNote.trim()) {
        addNoteMutation.mutate(newNote.trim());
      }
    }
  };

  if (!conversation) {
    return <div className="w-[360px] border-l bg-gray-50"></div>;
  }

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
    <div className="w-[360px] border-l flex flex-col h-full bg-white">
      <div className="p-4 text-center border-b">
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src={customer.avatar_url || '/placeholder.svg'} />
          <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="mt-3 font-bold text-lg">{customerName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <TagIcon className="w-4 h-4" />
              Tags
            </h4>
            <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-muted-foreground">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Thêm tag...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[220px]" align="start">
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
                <Badge key={tag.id} className={cn("py-1 pl-2 pr-1 gap-1.5 border-transparent", tag.color, "text-white")}>
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
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-3">
            <Notebook className="w-4 h-4" />
            Ghi chú
          </h4>
          <div className="space-y-4">
            {isLoadingNotes ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-4/5" />
              </div>
            ) : notes && notes.length > 0 ? (
              notes.map((note) => <NoteItem key={note.id} note={note} />)
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có ghi chú nào.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-white">
        <Textarea
          placeholder="Thêm ghi chú... (Enter để gửi)"
          rows={2}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleNoteKeyDown}
          disabled={addNoteMutation.isPending}
        />
      </div>
    </div>
  );
};

export default CustomerInfoPanel;