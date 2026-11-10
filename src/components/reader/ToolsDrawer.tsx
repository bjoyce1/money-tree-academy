import { useState, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Bookmark, Headphones, Highlighter, MessageCircleQuestion, NotebookPen, Trash2, X } from 'lucide-react';
import type { Chapter } from '@/data/content';
import {
  addBookmark,
  addNote,
  deleteBookmark,
  deleteHighlight,
  deleteNote,
  useBookmarks,
  useHighlightsList,
  useNotes,
} from '@/lib/study';
import { ListenTool, type Speech } from './ListenTool';
import { AskGuide, askAvailable } from './AskGuide';
import { AccountAsk } from './AccountAsk';

export type ToolId = 'notes' | 'highlights' | 'bookmarks' | 'listen' | 'ask';

type Props = {
  chapter: Chapter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: ToolId;
  onTabChange: (t: ToolId) => void;
  /** Where the reader is in the chapter, 0–100, and a line of text there. */
  getPlace: () => { position: number; excerpt: string };
  onJumpTo: (place: { position?: number; highlightId?: string }) => void;
  speech: Speech;
  /** Where keyboard focus goes back to when the drawer closes. */
  returnFocusTo?: RefObject<HTMLElement>;
};

const TABS: { id: ToolId; label: string; icon: ReactNode }[] = [
  { id: 'notes', label: 'Notes', icon: <NotebookPen size={18} aria-hidden /> },
  { id: 'highlights', label: 'Highlights', icon: <Highlighter size={18} aria-hidden /> },
  { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={18} aria-hidden /> },
  { id: 'listen', label: 'Listen', icon: <Headphones size={18} aria-hidden /> },
  { id: 'ask', label: 'Ask', icon: <MessageCircleQuestion size={18} aria-hidden /> },
];

const quietButton =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-reader-quiet hover:text-reader-accent';

/** Study tools, out of the way of the story until the reader asks for them. */
export function ToolsDrawer({ chapter, open, onOpenChange, tab, onTabChange, getPlace, onJumpTo, speech, returnFocusTo }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-night/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-reader-rule bg-reader-surface text-reader-ink data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            if (!returnFocusTo?.current) return;
            e.preventDefault();
            returnFocusTo.current.focus({ preventScroll: true });
          }}
        >
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <Dialog.Title className="font-display text-[1.15rem] font-bold text-reader-accent">Study tools</Dialog.Title>
            <Dialog.Close className={quietButton} aria-label="Close study tools">
              <X size={20} aria-hidden />
            </Dialog.Close>
          </div>
          <Tabs.Root value={tab} onValueChange={(v) => onTabChange(v as ToolId)} className="flex min-h-0 flex-1 flex-col">
            <Tabs.List aria-label="Tools" className="grid grid-cols-5 border-b border-reader-rule px-2">
              {TABS.map((t) => (
                <Tabs.Trigger
                  key={t.id}
                  value={t.id}
                  className="-mb-px flex min-h-[3.5rem] flex-col items-center justify-center gap-1 border-b-2 border-transparent px-1 text-[0.8125rem] text-reader-quiet hover:text-reader-ink data-[state=active]:border-reader-accent data-[state=active]:text-reader-accent"
                  data-testid={`tool-${t.id}`}
                >
                  {t.icon}
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <Tabs.Content value="notes">
                <NotesTool chapterId={chapter.id} />
              </Tabs.Content>
              <Tabs.Content value="highlights">
                <HighlightsTool chapterId={chapter.id} onJumpTo={onJumpTo} />
              </Tabs.Content>
              <Tabs.Content value="bookmarks">
                <BookmarksTool chapter={chapter} getPlace={getPlace} onJumpTo={onJumpTo} />
              </Tabs.Content>
              <Tabs.Content value="listen">
                <ListenTool speech={speech} title={chapter.title} />
              </Tabs.Content>
              <Tabs.Content value="ask">
                <AskTool chapter={chapter} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-choice border border-dashed border-reader-rule px-4 py-6 text-center text-reader-quiet">{children}</p>;
}

function when(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NotesTool({ chapterId }: { chapterId: string }) {
  const notes = useNotes(chapterId);
  const [text, setText] = useState('');

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addNote(chapterId, text);
          setText('');
        }}
      >
        <label htmlFor="note-text" className="font-bold">
          Write a note about this chapter
        </label>
        <textarea
          id="note-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="What did you notice? What would you do?"
          className="mt-2 w-full resize-y rounded-choice border border-reader-rule bg-reader-bg px-3 py-2.5 text-reader-ink placeholder:text-reader-quiet focus:border-reader-accent focus:outline-none"
          data-testid="input-note"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="mt-2 inline-flex min-h-[2.75rem] items-center rounded-pill bg-gold px-5 font-bold text-night hover:bg-gold-hover disabled:opacity-45"
          data-testid="button-add-note"
        >
          Save note
        </button>
      </form>
      <h3 className="mt-7 text-[0.875rem] text-reader-quiet">Your notes ({notes.length})</h3>
      <ul className="mt-2 divide-y divide-[var(--r-rule)]">
        {notes.length === 0 && (
          <li className="list-none pt-1">
            <Empty>No notes yet for this chapter.</Empty>
          </li>
        )}
        {[...notes].reverse().map((n) => (
          <li key={n.id} className="flex items-start gap-2 py-3">
            <div className="flex-1">
              <p className="whitespace-pre-wrap">{n.text}</p>
              <p className="mt-1 text-[0.8125rem] text-reader-quiet">{when(n.createdAt)}</p>
            </div>
            <button type="button" onClick={() => deleteNote(n.id)} className={quietButton} aria-label="Delete note">
              <Trash2 size={17} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HighlightsTool({ chapterId, onJumpTo }: { chapterId: string; onJumpTo: Props['onJumpTo'] }) {
  const highlights = useHighlightsList(chapterId);
  return (
    <div>
      <p className="text-reader-soft">Select words in the story, then choose Highlight.</p>
      <ul className="mt-4 divide-y divide-[var(--r-rule)]">
        {highlights.length === 0 && (
          <li className="list-none">
            <Empty>No highlights yet.</Empty>
          </li>
        )}
        {highlights.map((h) => (
          <li key={h.id} className="flex items-start gap-2 py-3">
            <button
              type="button"
              onClick={() => onJumpTo({ highlightId: h.id })}
              className="flex-1 rounded-thumb text-left hover:text-reader-accent"
            >
              <span className="rounded-[3px] bg-[var(--r-mark)] px-1 [box-decoration-break:clone]">{h.text}</span>
            </button>
            <button
              type="button"
              onClick={() => deleteHighlight(chapterId, h.id)}
              className={quietButton}
              aria-label="Remove highlight"
            >
              <Trash2 size={17} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookmarksTool({
  chapter,
  getPlace,
  onJumpTo,
}: {
  chapter: Chapter;
  getPlace: Props['getPlace'];
  onJumpTo: Props['onJumpTo'];
}) {
  const bookmarks = useBookmarks(chapter.id);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          const place = getPlace();
          addBookmark({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            position: place.position,
            label: `${Math.round(place.position)}% through`,
            excerpt: place.excerpt,
          });
        }}
        className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-pill bg-gold px-5 font-bold text-night hover:bg-gold-hover"
        data-testid="button-add-bookmark"
      >
        <Bookmark size={18} aria-hidden />
        Bookmark this place
      </button>
      <ul className="mt-5 divide-y divide-[var(--r-rule)]">
        {bookmarks.length === 0 && (
          <li className="list-none">
            <Empty>No bookmarks in this chapter.</Empty>
          </li>
        )}
        {bookmarks.map((b) => (
          <li key={b.id} className="flex items-start gap-2 py-3">
            <button
              type="button"
              onClick={() => onJumpTo({ position: b.position })}
              className="flex-1 text-left hover:text-reader-accent"
            >
              <span className="block font-bold">{b.label}</span>
              {b.excerpt && <span className="mt-0.5 line-clamp-2 block text-[0.9375rem] text-reader-quiet">{b.excerpt}</span>}
            </button>
            <button type="button" onClick={() => deleteBookmark(b.id)} className={quietButton} aria-label="Delete bookmark">
              <Trash2 size={17} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AskTool({ chapter }: { chapter: Chapter }) {
  // With the Supabase chat function (the Lovable build), anyone can ask.
  if (askAvailable) return <AskGuide chapter={chapter} />;
  return <AccountAsk chapter={chapter} />;
}
