import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Inbox, ChevronsRight, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConversationItem from './ConversationItem';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConversationInboxItem } from '@/types/chat';
import { Checkbox } from '@/components/ui/checkbox';
import { MoveToFolder } from './MoveToFolder';

interface InboxPanelProps {
  conversations: ConversationInboxItem[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  selectedFolderId: string | null;
}

const InboxPanel = ({ conversations, selectedConversationId, onSelectConversation, selectedFolderId }: InboxPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const allCount = conversations.length;

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm.trim() === '') return true;

    const customerName = conv.customer?.display_name?.toLowerCase() || '';
    return customerName.includes(searchTerm.toLowerCase());
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConvIds(filteredConversations.map(c => c.id));
    } else {
      setSelectedConvIds([]);
    }
  };

  const handleSelectOne = (convId: string, checked: boolean) => {
    if (checked) {
      setSelectedConvIds(prev => [...prev, convId]);
    } else {
      setSelectedConvIds(prev => prev.filter(id => id !== convId));
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedConvIds([]);
    }
  };

  const customerIdsToMove = conversations
    .filter(c => selectedConvIds.includes(c.id) && c.customer?.id)
    .map(c => c.customer!.id!);

  return (
    <div className="w-[320px] border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Hộp thư
          </h2>
          <Button variant="ghost" size="sm" onClick={handleToggleSelectionMode} className="text-sm">
            {isSelectionMode ? <X className="w-4 h-4 mr-1" /> : <ChevronsRight className="w-4 h-4 mr-1" />}
            {isSelectionMode ? 'Hủy' : 'Di chuyển'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 bg-orange-50 text-orange-600"
              >
                <Inbox className="w-4 h-4" />
                <span className="font-semibold">{allCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Tất cả</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
      {isSelectionMode && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all"
              checked={selectedConvIds.length > 0 && selectedConvIds.length === filteredConversations.length}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              {selectedConvIds.length > 0 ? `${selectedConvIds.length} đã chọn` : 'Chọn tất cả'}
            </label>
          </div>
          {selectedConvIds.length > 0 && (
            <MoveToFolder 
              selectedCustomerIds={customerIdsToMove}
              onSuccess={() => {
                setSelectedConvIds([]);
                setIsSelectionMode(false);
              }}
            />
          )}
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedConversationId}
              onClick={onSelectConversation}
              isMultiSelected={selectedConvIds.includes(conv.id)}
              onMultiSelect={handleSelectOne}
              isSelectionMode={isSelectionMode}
              selectedFolderId={selectedFolderId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InboxPanel;