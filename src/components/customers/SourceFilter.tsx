import * as React from "react"
import { Check, PlusCircle, Users } from "lucide-react"
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
import { CustomerSource } from "@/pages/Tags";

const useAvailableSources = () => {
  return useQuery<CustomerSource[]>({
    queryKey: ['customer_sources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customer_sources').select('*').order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

interface SourceFilterProps {
  selectedSourceIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function SourceFilter({ selectedSourceIds, onChange }: SourceFilterProps) {
  const { data: availableSources = [] } = useAvailableSources();

  const selectedSources = availableSources.filter(source => selectedSourceIds.includes(source.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed bg-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nguồn
          {selectedSources.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedSources.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedSources.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedSources.length} đã chọn
                  </Badge>
                ) : (
                  selectedSources.map((source) => (
                    <Badge
                      variant="secondary"
                      key={source.id}
                      className="rounded-sm px-1 font-normal"
                    >
                      {source.name}
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
          <CommandInput placeholder="Tìm nguồn..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy nguồn.</CommandEmpty>
            <CommandGroup>
              {availableSources.map((source) => {
                const isSelected = selectedSourceIds.includes(source.id);
                return (
                  <CommandItem
                    key={source.id}
                    onSelect={() => {
                      if (isSelected) {
                        onChange(selectedSourceIds.filter((id) => id !== source.id));
                      } else {
                        onChange([...selectedSourceIds, source.id]);
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
                    <div className={cn("w-4 h-4 rounded-sm mr-2 flex items-center justify-center text-white", source.color)}>
                      <Users className="w-2.5 h-2.5" />
                    </div>
                    <span>{source.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedSourceIds.length > 0 && (
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