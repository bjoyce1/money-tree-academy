import { useState, useEffect } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Edit3, ExternalLink, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { bookmarksAPI } from '@/lib/api';

export interface BookmarkItem {
  id: string;
  chapterId: string;
  chapterTitle: string;
  position: number;
  label: string;
  excerpt: string;
  createdAt: number;
  isFavorite?: boolean;
}

interface BookmarkManagerProps {
  chapterId: string;
  chapterTitle: string;
  currentScrollPosition?: number;
}

export default function BookmarkManager({ chapterId, chapterTitle, currentScrollPosition = 0 }: BookmarkManagerProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Get bookmarks from API
  const { data: apiBookmarks = [] } = useQuery({
    queryKey: ['/api/bookmarks'],
    enabled: isAuthenticated,
  });
  
  // Fallback localStorage state for guest users
  const [localBookmarks, setLocalBookmarks] = useState<BookmarkItem[]>([]);
  
  // Load localStorage bookmarks for guest users
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem('user_bookmarks');
      const allBookmarksData = stored ? JSON.parse(stored) : [];
      setLocalBookmarks(allBookmarksData);
    }
  }, [isAuthenticated]);
  
  const allBookmarks = isAuthenticated ? apiBookmarks : localBookmarks;
  const bookmarks = allBookmarks.filter((b: BookmarkItem) => b.chapterId === chapterId);

  // Mutations for API operations
  const addBookmarkMutation = useMutation({
    mutationFn: (bookmark: { chapterId: string; position: number; label: string; excerpt: string }) => 
      bookmarksAPI.create(bookmark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BookmarkItem> }) => 
      bookmarksAPI.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => bookmarksAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    },
  });

  // Save bookmarks to localStorage (guest users only)
  const saveLocalBookmarks = (updatedAllBookmarks: BookmarkItem[]) => {
    localStorage.setItem('user_bookmarks', JSON.stringify(updatedAllBookmarks));
    setLocalBookmarks(updatedAllBookmarks);
  };

  // Add new bookmark
  const addBookmark = () => {
    if (!newLabel.trim()) return;

    // Get excerpt from current scroll position
    const content = document.querySelector('[data-testid="chapter-content"]');
    const excerpt = content ? getExcerptAtPosition(content, currentScrollPosition) : 'Bookmarked section';

    if (isAuthenticated) {
      // Use API to add bookmark
      addBookmarkMutation.mutate({
        chapterId,
        position: currentScrollPosition,
        label: newLabel.trim(),
        excerpt,
      });
    } else {
      // Fallback to localStorage for guest users
      const newBookmark: BookmarkItem = {
        id: Math.random().toString(36).substr(2, 9),
        chapterId,
        chapterTitle,
        position: currentScrollPosition,
        label: newLabel.trim(),
        excerpt,
        createdAt: Date.now(),
        isFavorite: false,
      };

      const updatedAllBookmarks = [...localBookmarks, newBookmark].sort((a, b) => b.createdAt - a.createdAt);
      saveLocalBookmarks(updatedAllBookmarks);
    }
    
    setNewLabel('');
    setShowAddForm(false);
  };

  // Get text excerpt from position
  const getExcerptAtPosition = (element: Element, position: number): string => {
    const text = element.textContent || '';
    const words = text.split(' ');
    const startIndex = Math.max(0, Math.floor(position * words.length / 100) - 5);
    const endIndex = Math.min(words.length, startIndex + 15);
    return words.slice(startIndex, endIndex).join(' ') + '...';
  };

  // Update bookmark label
  const updateBookmark = (id: string, newLabelText: string) => {
    if (isAuthenticated) {
      updateBookmarkMutation.mutate({
        id,
        updates: { label: newLabelText.trim() }
      });
    } else {
      const updatedAllBookmarks = localBookmarks.map(b => 
        b.id === id ? { ...b, label: newLabelText.trim() } : b
      );
      saveLocalBookmarks(updatedAllBookmarks);
    }
    setEditingId(null);
  };

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    const bookmark = allBookmarks.find(b => b.id === id);
    if (!bookmark) return;
    
    if (isAuthenticated) {
      updateBookmarkMutation.mutate({
        id,
        updates: { isFavorite: !bookmark.isFavorite }
      });
    } else {
      const updatedAllBookmarks = localBookmarks.map(b => 
        b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
      );
      saveLocalBookmarks(updatedAllBookmarks);
    }
  };

  // Remove bookmark
  const removeBookmark = (id: string) => {
    if (isAuthenticated) {
      deleteBookmarkMutation.mutate(id);
    } else {
      const updatedAllBookmarks = localBookmarks.filter(b => b.id !== id);
      saveLocalBookmarks(updatedAllBookmarks);
    }
  };

  // Navigate to bookmark
  const navigateToBookmark = (bookmark: BookmarkItem) => {
    if (bookmark.chapterId !== chapterId) {
      // Navigate to different chapter
      window.location.href = `/read/${bookmark.chapterId}`;
    } else {
      // Scroll to position in current chapter
      const element = document.querySelector('[data-testid="chapter-content"]');
      if (element) {
        const scrollPosition = (bookmark.position / 100) * element.scrollHeight;
        element.scrollIntoView({ behavior: 'smooth' });
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }
    }
  };

  const displayedBookmarks = filterFavorites ? bookmarks.filter(b => b.isFavorite) : bookmarks;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="text-purple-400" size={20} />
          <h3 className="font-semibold text-slate-100">Bookmarks</h3>
          <span className="text-sm text-slate-400">({bookmarks.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {bookmarks.some(b => b.isFavorite) && (
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`p-2 rounded-lg transition-colors ${
                filterFavorites ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-slate-800 text-slate-400'
              }`}
              data-testid="button-filter-favorites"
            >
              <Star size={16} />
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            data-testid="button-add-bookmark"
          >
            <BookmarkPlus className="text-purple-400" size={16} />
          </button>
        </div>
      </div>

      {/* Add Bookmark Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-600">
          <div className="text-sm text-slate-300 mb-2">Add bookmark at current position</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Enter bookmark label..."
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:border-purple-400 focus:outline-none"
              data-testid="input-bookmark-label"
              onKeyPress={(e) => e.key === 'Enter' && addBookmark()}
            />
            <button
              onClick={addBookmark}
              disabled={!newLabel.trim()}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:bg-slate-600 disabled:text-slate-400 transition-colors"
              data-testid="button-save-bookmark"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Bookmark List */}
      {displayedBookmarks.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displayedBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigateToBookmark(bookmark)}>
                <div className="flex items-center gap-2 mb-1">
                  {editingId === bookmark.id ? (
                    <input
                      type="text"
                      defaultValue={bookmark.label}
                      className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-slate-300 focus:border-purple-400 focus:outline-none"
                      onBlur={(e) => updateBookmark(bookmark.id, e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && updateBookmark(bookmark.id, (e.target as HTMLInputElement).value)}
                      autoFocus
                      data-testid={`input-edit-bookmark-${bookmark.id}`}
                    />
                  ) : (
                    <>
                      <span className="font-medium text-slate-100 truncate">{bookmark.label}</span>
                      {bookmark.chapterId !== chapterId && (
                        <ExternalLink className="text-slate-500" size={12} />
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-400 truncate">{bookmark.excerpt}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {bookmark.chapterTitle} • {new Date(bookmark.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(bookmark.id);
                  }}
                  className={`p-1 rounded transition-colors ${
                    bookmark.isFavorite 
                      ? 'text-yellow-400 hover:text-yellow-300' 
                      : 'text-slate-500 hover:text-yellow-400'
                  }`}
                  data-testid={`button-favorite-${bookmark.id}`}
                >
                  <Star size={14} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(bookmark.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  data-testid={`button-edit-${bookmark.id}`}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark(bookmark.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                  data-testid={`button-remove-${bookmark.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">
          <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {filterFavorites 
              ? 'No favorite bookmarks in this chapter'
              : 'No bookmarks yet. Click the + to add your first bookmark!'
            }
          </p>
        </div>
      )}

      {/* All Bookmarks Summary */}
      {allBookmarks.length > bookmarks.length && (
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 text-center">
            {allBookmarks.length - bookmarks.length} more bookmarks in other chapters
          </div>
        </div>
      )}
    </div>
  );
}