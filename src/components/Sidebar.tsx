import { useInboxFolders } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Inbox, Folder, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface SidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

const Sidebar = ({ selectedFolderId, onSelectFolder }: SidebarProps) => {
  const { data: folders, isLoading } = useInboxFolders();

  if (isLoading) {
    return (
      <aside className="flex flex-col items-center w-14 p-2 gap-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </aside>
    );
  }

  return (
    <aside className="flex flex-col items-center w-14 p-2 gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-10 h-10 rounded-lg border',
              selectedFolderId === null
                ? 'bg-orange-50 border-orange-300'
                : 'bg-white border-gray-200 hover:bg-gray-100',
            )}
            onClick={() => onSelectFolder(null)}
          >
            <Inbox className={cn('w-5 h-5', selectedFolderId === null ? 'text-orange-500' : 'text-gray-700')} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tất cả</p>
        </TooltipContent>
      </Tooltip>

      {folders?.map((folder) => {
        const isActive = selectedFolderId === folder.id;
        return (
          <Tooltip key={folder.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'w-10 h-10 rounded-lg border',
                  isActive
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-gray-200 hover:bg-gray-100',
                )}
                onClick={() => onSelectFolder(folder.id)}
              >
                <Folder className={cn('w-5 h-5', isActive ? 'text-orange-500' : 'text-gray-700')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{folder.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </aside>
  );
};

export default Sidebar;