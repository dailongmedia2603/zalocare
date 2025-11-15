import * as React from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Folder, Loader2, ChevronsRight } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useInboxFolders } from "@/hooks/use-chat";

interface MoveToFolderProps {
  selectedCustomerIds: string[];
  onSuccess: () => void;
}

export const MoveToFolder = ({ selectedCustomerIds, onSuccess }: MoveToFolderProps) => {
  const [open, setOpen] = React.useState(false);
  const { data: folders = [], isLoading: isLoadingFolders } = useInboxFolders();
  const queryClient = useQueryClient();

  const moveMutation = useMutation({
    mutationFn: async ({ customerIds, folderId }: { customerIds: string[], folderId: string | null }) => {
      const { error } = await supabase
        .from('customers')
        .update({ folder_id: folderId })
        .in('id', customerIds);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess(`Đã di chuyển ${selectedCustomerIds.length} cuộc trò chuyện.`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onSuccess();
      setOpen(false);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const handleMove = (folderId: string | null) => {
    moveMutation.mutate({ customerIds: selectedCustomerIds, folderId });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ChevronsRight className="mr-2 h-4 w-4" />
          Di chuyển
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm thư mục..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy thư mục.</CommandEmpty>
            <CommandGroup>
              {isLoadingFolders ? (
                <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                folders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    onSelect={() => handleMove(folder.id)}
                    className="cursor-pointer"
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    <span>{folder.name}</span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};