import * as React from "react"
import { Check, PlusCircle, Folder } from "lucide-react"
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { InboxFolder } from "@/types/inbox";

const useAvailableFolders = () => {
  return useQuery<InboxFolder[]>({
    queryKey: ['inbox_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inbox_folders').select('*').order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

interface FolderFilterProps {
  selectedFolderIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function FolderFilter({ selectedFolderIds, onChange }: FolderFilterProps) {
  const { data: availableFolders = [] } = useAvailableFolders();

  const selectedFolders = availableFolders.filter(folder => selectedFolderIds.includes(folder.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed bg-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Thư mục
          {selectedFolders.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedFolders.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedFolders.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedFolders.length} đã chọn
                  </Badge>
                ) : (
                  selectedFolders.map((folder) => (
                    <Badge
                      variant="secondary"
                      key={folder.id}
                      className="rounded-sm px-1 font-normal"
                    >
                      {folder.name}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm thư mục..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {availableFolders.map((folder) => {
                const isSelected = selectedFolderIds.includes(folder.id);
                return (
                  <CommandItem
                    key={folder.id}
                    onSelect={() => {
                      if (isSelected) {
                        onChange(selectedFolderIds.filter((id) => id !== folder.id));
                      } else {
                        onChange([...selectedFolderIds, folder.id]);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{folder.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedFolderIds.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Xóa bộ lọc
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}