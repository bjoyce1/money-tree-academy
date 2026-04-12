import { useState, useEffect, useRef } from 'react';
import { Highlighter, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { highlightsAPI } from '@/lib/api';

export interface Highlight {
  id: string;
  chapterId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  color: string;
  note?: string;
  createdAt: number;
}

interface HighlightManagerProps {
  chapterId: string;
  contentRef: React.RefObject<HTMLDivElement>;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef3c7', class: 'bg-yellow-200/60' },
  { name: 'Green', value: '#d1fae5', class: 'bg-green-200/60' },
  { name: 'Blue', value: '#dbeafe', class: 'bg-blue-200/60' },
  { name: 'Pink', value: '#fce7f3', class: 'bg-pink-200/60' },
  { name: 'Purple', value: '#e9d5ff', class: 'bg-purple-200/60' },
];

export default function HighlightManager({ chapterId, contentRef }: HighlightManagerProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [showHighlights, setShowHighlights] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(-1);

  // Get highlights from API
  const { data: apiHighlights = [] } = useQuery({
    queryKey: ['/api/highlights', chapterId],
    enabled: isAuthenticated,
  });
  
  // Fallback localStorage state for guest users
  const [localHighlights, setLocalHighlights] = useState<Highlight[]>([]);
  
  // Load highlights for this chapter (guest users)
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem(`highlights_${chapterId}`);
      if (stored) {
        setLocalHighlights(JSON.parse(stored));
      }
    }
  }, [chapterId, isAuthenticated]);
  
  const highlights = isAuthenticated ? apiHighlights : localHighlights;

  // Mutations for API operations
  const addHighlightMutation = useMutation({
    mutationFn: (highlight: { chapterId: string; startOffset: number; endOffset: number; text: string; color: string; note?: string }) => 
      highlightsAPI.create(highlight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/highlights', chapterId] });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: (id: string) => highlightsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/highlights', chapterId] });
    },
  });

  // Save highlights to localStorage (guest users only)
  const saveLocalHighlights = (newHighlights: Highlight[]) => {
    localStorage.setItem(`highlights_${chapterId}`, JSON.stringify(newHighlights));
    setLocalHighlights(newHighlights);
  };

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && contentRef.current) {
        const range = selection.getRangeAt(0);
        const content = contentRef.current;
        
        // Check if selection is within our content
        if (content.contains(range.commonAncestorContainer)) {
          const text = selection.toString().trim();
          const fullText = content.textContent || '';
          const startOffset = getTextOffset(content, range.startContainer, range.startOffset);
          const endOffset = getTextOffset(content, range.endContainer, range.endOffset);
          
          if (text.length > 10 && text.length < 500) { // Reasonable selection length
            setSelectedText(text);
            setSelectionRange({ start: startOffset, end: endOffset });
          }
        }
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [contentRef]);

  // Get text offset within container
  const getTextOffset = (container: Element, node: Node, offset: number): number => {
    let textOffset = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }
    return textOffset;
  };

  // Add highlight
  const addHighlight = (note?: string) => {
    if (!selectionRange || !selectedText) return;

    if (isAuthenticated) {
      // Use API to add highlight
      addHighlightMutation.mutate({
        chapterId,
        startOffset: selectionRange.start,
        endOffset: selectionRange.end,
        text: selectedText,
        color: selectedColor.value,
        note,
      });
    } else {
      // Fallback to localStorage for guest users
      const newHighlight: Highlight = {
        id: Math.random().toString(36).substr(2, 9),
        chapterId,
        startOffset: selectionRange.start,
        endOffset: selectionRange.end,
        text: selectedText,
        color: selectedColor.value,
        note,
        createdAt: Date.now(),
      };

      const updatedHighlights = [...localHighlights, newHighlight].sort((a, b) => a.startOffset - b.startOffset);
      saveLocalHighlights(updatedHighlights);
    }
    
    // Clear selection
    setSelectedText('');
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // Remove highlight
  const removeHighlight = (id: string) => {
    if (isAuthenticated) {
      deleteHighlightMutation.mutate(id);
    } else {
      const updatedHighlights = localHighlights.filter(h => h.id !== id);
      saveLocalHighlights(updatedHighlights);
    }
  };

  // Navigate to next/previous highlight
  const navigateHighlight = (direction: 'next' | 'prev') => {
    if (highlights.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentHighlightIndex < highlights.length - 1 ? currentHighlightIndex + 1 : 0;
    } else {
      newIndex = currentHighlightIndex > 0 ? currentHighlightIndex - 1 : highlights.length - 1;
    }
    
    setCurrentHighlightIndex(newIndex);
    scrollToHighlight(highlights[newIndex]);
  };

  // Scroll to highlight
  const scrollToHighlight = (highlight: Highlight) => {
    const element = document.getElementById(`highlight-${highlight.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Highlighter className="text-brand2" size={20} />
          <h3 className="font-semibold text-slate-100">Text Highlights</h3>
          <span className="text-sm text-slate-400">({highlights.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            data-testid="button-toggle-highlights"
          >
            {showHighlights ? (
              <Eye className="text-slate-400" size={16} />
            ) : (
              <EyeOff className="text-slate-400" size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      {selectedText && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-600">
          <div className="text-sm text-slate-300 mb-2">Selected text:</div>
          <div className="text-xs text-slate-400 bg-slate-900 p-2 rounded mb-3 max-h-20 overflow-y-auto">
            "{selectedText}"
          </div>
          
          {/* Color Selection */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-slate-300">Color:</span>
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  selectedColor.name === color.name ? 'border-white scale-110' : 'border-slate-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                data-testid={`color-${color.name.toLowerCase()}`}
              />
            ))}
          </div>
          
          <button
            onClick={() => addHighlight()}
            className="w-full bg-brand2 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-brand2/90 transition-colors"
            data-testid="button-add-highlight"
          >
            Highlight Selection
          </button>
        </div>
      )}

      {/* Highlight Navigation */}
      {highlights.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-2 bg-slate-800 rounded-lg">
          <div className="text-sm text-slate-300">
            Highlights: {currentHighlightIndex + 1} / {highlights.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateHighlight('prev')}
              className="p-1 rounded hover:bg-slate-700 transition-colors"
              data-testid="button-prev-highlight"
            >
              <ArrowUp className="text-slate-400" size={16} />
            </button>
            <button
              onClick={() => navigateHighlight('next')}
              className="p-1 rounded hover:bg-slate-700 transition-colors"
              data-testid="button-next-highlight"
            >
              <ArrowDown className="text-slate-400" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Highlight List */}
      {highlights.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {highlights.map((highlight, index) => (
            <div
              key={highlight.id}
              className="flex items-center justify-between p-2 bg-slate-800 rounded-lg group"
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs text-slate-300 truncate cursor-pointer hover:text-white"
                  onClick={() => scrollToHighlight(highlight)}
                  style={{ backgroundColor: `${highlight.color}30` }}
                >
                  "{highlight.text}"
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(highlight.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => removeHighlight(highlight.id)}
                className="p-1 rounded hover:bg-red-600/20 opacity-0 group-hover:opacity-100 transition-all"
                data-testid={`button-remove-highlight-${highlight.id}`}
              >
                <Trash2 className="text-red-400" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {highlights.length === 0 && (
        <div className="text-center text-slate-400 py-6">
          <Highlighter className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select text to create your first highlight</p>
        </div>
      )}
    </div>
  );
}

// Custom hook to apply highlights to content
export function useHighlights(chapterId: string, content: string) {
  const [highlightedContent, setHighlightedContent] = useState(content);

  useEffect(() => {
    const stored = localStorage.getItem(`highlights_${chapterId}`);
    const highlights: Highlight[] = stored ? JSON.parse(stored) : [];

    if (highlights.length === 0) {
      setHighlightedContent(content);
      return;
    }

    // Remove existing HTML tags for processing
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Sort highlights by position
    const sortedHighlights = highlights.sort((a, b) => a.startOffset - b.startOffset);
    
    let result = textContent;
    let offset = 0;

    sortedHighlights.forEach((highlight) => {
      const start = highlight.startOffset + offset;
      const end = highlight.endOffset + offset;
      const highlightedText = `<span id="highlight-${highlight.id}" class="highlight-text" style="background-color: ${highlight.color}; padding: 2px 4px; border-radius: 4px; cursor: pointer;" title="${highlight.note || 'Highlight'}">${highlight.text}</span>`;
      
      result = result.substring(0, start) + highlightedText + result.substring(end);
      offset += highlightedText.length - highlight.text.length;
    });

    setHighlightedContent(result);
  }, [chapterId, content]);

  return highlightedContent;
}