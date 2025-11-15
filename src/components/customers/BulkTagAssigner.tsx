import * as React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from "@/pages/Tags";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Tag as TagIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

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

interface BulkTagAssignerProps {
  selectedCustomerIds: string[];
  onSuccess: () => void;
}

export const BulkTagAssigner = ({ selectedCustomerIds, onSuccess }: BulkTagAssignerProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const { data: availableTags = [], isLoading: isLoadingTags } = useAvailableTags();
  const queryClient = useQueryClient();

  const assignTagsMutation = useMutation({
    mutationFn: async ({ customerIds, tagIds }: { customerIds: string[], tagIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const newAssignments = customerIds.flatMap(customerId =>
        tagIds.map(tagId => ({
          customer_id: customerId,
          tag_id: tagId,
          user_id: user.id,
        }))
      );

      if (newAssignments.length === 0) return;

      const { error } = await supabase
        .from('customer_tags')
        .upsert(newAssignments, { onConflict: 'customer_id,tag_id' });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess(`Đã gán tag cho ${selectedCustomerIds.length} khách hàng.`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Sync with chat inbox
      onSuccess();
      setSelectedTagIds([]);
      setOpen(false);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const handleApply = () => {
    if (selectedTagIds.length > 0) {
      assignTagsMutation.mutate({ customerIds: selectedCustomerIds, tagIds: selectedTagIds });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <TagIcon className="mr-2 h-4 w-4" />
          Gán Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm tag..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy tag.</CommandEmpty>
            <CommandGroup>
              {isLoadingTags ? (
                <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        if (isSelected) {
                          setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                        } else {
                          setSelectedTagIds([...selectedTagIds, tag.id]);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <div className={cn("w-4 h-4 rounded-sm mr-2", tag.color)}></div>
                      <span>{tag.name}</span>
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="p-2 border-t">
          <Button
            onClick={handleApply}
            disabled={selectedTagIds.length === 0 || assignTagsMutation.isPending}
            className="w-full"
          >
            {assignTagsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Áp dụng
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};