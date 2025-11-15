import * as React from "react"
import { Check, PlusCircle } from "lucide-react"
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
import { Tag } from "@/pages/Tags";

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

interface TagFilterProps {
  selectedTagIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function TagFilter({ selectedTagIds, onChange }: TagFilterProps) {
  const { data: availableTags = [] } = useAvailableTags();

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed bg-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Tags
          {selectedTags.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedTags.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedTags.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedTags.length} đã chọn
                  </Badge>
                ) : (
                  selectedTags.map((tag) => (
                    <Badge
                      variant="secondary"
                      key={tag.id}
                      className="rounded-sm px-1 font-normal"
                    >
                      {tag.name}
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
          <CommandInput placeholder="Tìm tag..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy tag.</CommandEmpty>
            <CommandGroup>
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => {
                      if (isSelected) {
                        onChange(selectedTagIds.filter((id) => id !== tag.id));
                      } else {
                        onChange([...selectedTagIds, tag.id]);
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
                    <div className={cn("w-4 h-4 rounded-sm mr-2", tag.color)}></div>
                    <span>{tag.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedTagIds.length > 0 && (
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