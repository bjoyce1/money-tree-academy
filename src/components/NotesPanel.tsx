import { useEffect, useState } from 'react';
import { StickyNote, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { notesAPI } from '@/lib/api';
import { useCoins } from './CoinsSystem';

type Note = {
  id: string;
  chapterId: string;
  text: string;
  quote?: string;
  createdAt: number;
};

function key(userId: string) {
  return `notes:${userId}`;
}

export default function NotesPanel({ userId = 'local', chapterId }: { userId?: string, chapterId: string }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const { awardCoins } = useCoins();

  // Get notes from API
  const { data: notes = [] as any[] = [] } = useQuery({
    queryKey: ['/api/notes', chapterId],
    enabled: isAuthenticated,
  });

  // Fallback to localStorage for guest users
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      const raw = localStorage.getItem(key(userId));
      const all = raw ? JSON.parse(raw) as Note[] : [];
      setLocalNotes(all.filter(n => n.chapterId === chapterId));
    }
  }, [userId, chapterId, isAuthenticated]);

  const displayNotes = isAuthenticated ? notes : localNotes;

  // Mutations for API operations
  const addNoteMutation = useMutation({
    mutationFn: (note: { text: string; chapterId: string; quote?: string }) => 
      notesAPI.create(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', chapterId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesAPI.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', chapterId] });
    },
  });

  const saveLocal = (list: Note[]) => {
    const raw = localStorage.getItem(key(userId));
    const all = raw ? JSON.parse(raw) as Note[] : [];
    const others = all.filter(n => n.chapterId !== chapterId);
    const merged = [...others, ...list];
    localStorage.setItem(key(userId), JSON.stringify(merged));
  };

  const add = () => {
    if (!text.trim()) return;
    
    if (isAuthenticated) {
      // Use API to add note
      addNoteMutation.mutate({
        text: text.trim(),
        chapterId,
      });
    } else {
      // Fallback to localStorage for guest users
      const n: Note = { 
        id: Math.random().toString(36).slice(2), 
        chapterId, 
        text: text.trim(), 
        createdAt: Date.now() 
      };
      const next = [...localNotes, n];
      setLocalNotes(next);
      saveLocal(next);
    }
    
    setText('');
    
    // Award coins for taking notes
    awardCoins(5, 'Added a personal note', 'bonus');
  };

  const remove = (id: string) => {
    if (isAuthenticated) {
      // Use API to delete note
      deleteNoteMutation.mutate(id);
    } else {
      // Fallback to localStorage for guest users
      const next = localNotes.filter(n => n.id !== id);
      setLocalNotes(next);
      saveLocal(next);
    }
  };

  return (
    <div className="mt-12 border-t border-slate-700 pt-8" data-testid="notes-panel">
      <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <StickyNote className="text-brand2" size={20} />
        Your Notes
      </h3>
      <div className="flex gap-3 mb-4">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Add a note about this chapter..." 
          className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:border-brand focus:outline-none"
          data-testid="input-note"
        />
        <button 
          onClick={add} 
          className="px-4 py-2 rounded-lg bg-brand text-slate-900 font-semibold hover:bg-brand/90 transition-colors"
          data-testid="button-add-note"
        >
          Add
        </button>
      </div>
      <div className="space-y-3" data-testid="notes-list">
        {displayNotes.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No notes yet. Add your first note above!</p>
        ) : (
          displayNotes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(n => (
            <div 
              key={n.id} 
              className="p-4 bg-slate-900 border border-slate-700 rounded-lg"
              data-testid={`note-${n.id}`}
            >
              <div className="text-sm text-slate-400 mb-2">
                {new Date(n.createdAt).toLocaleString()}
              </div>
              <div className="text-slate-300 mb-2">{n.text}</div>
              <button 
                onClick={() => remove(n.id)} 
                className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                data-testid={`button-delete-note-${n.id}`}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
