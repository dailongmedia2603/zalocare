import { Notebook } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CustomerNote } from '@/types/chat';

interface NoteItemProps {
  note: CustomerNote;
}

const NoteItem = ({ note }: NoteItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: vi });

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Notebook className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
};

export default NoteItem;