import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { icons } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

// A curated list of icons for better UX
const iconList = [
  'Tag', 'Star', 'Heart', 'Bookmark', 'Flag', 'ThumbsUp', 'ThumbsDown', 'Award',
  'Trophy', 'Gift', 'ShoppingBag', 'ShoppingCart', 'DollarSign', 'CreditCard',
  'User', 'Users', 'Building', 'Factory', 'Phone', 'Mail', 'MessageSquare',
  'Clock', 'Calendar', 'CheckCircle', 'XCircle', 'AlertTriangle', 'Info',
  'Lightbulb', 'Zap', 'Link', 'Lock', 'Key', 'Shield'
];

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const Icon = icons[value as keyof typeof icons] || icons['Tag'];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Icon className="h-4 w-4" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-[280px]">
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-6 gap-2">
            {iconList.map((iconName) => {
              const LoopIcon = icons[iconName as keyof typeof icons];
              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onChange(iconName)}
                  className="rounded-md"
                >
                  <LoopIcon className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};