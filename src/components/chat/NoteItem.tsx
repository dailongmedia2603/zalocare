import { Notebook, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CustomerNote } from '@/types/chat';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NoteItemProps {
  note: CustomerNote;
  isNewest: boolean;
  onUpdate: (noteId: string, content: string) => Promise<void>;
  onDelete: (note: CustomerNote) => void;
  isUpdating: boolean;
}

const NoteItem = ({ note, isNewest, onUpdate, onDelete, isUpdating }: NoteItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  const formattedDate = format(new Date(note.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi });

  const handleUpdate = async () => {
    if (content.trim() && content.trim() !== note.content) {
      await onUpdate(note.id, content.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(note.content);
    setIsEditing(false);
  };

  return (
    <div className={cn('flex items-start gap-3 p-2 rounded-lg', isNewest && 'bg-orange-50')}>
      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
        <Notebook className="h-4 w-4 text-orange-600" />
      </div>
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
          </>
        )}
      </div>
      {!isEditing && (
        <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDelete(note)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NoteItem;