import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Highlighter, X } from 'lucide-react';
import { GlossaryTerm } from './GlossaryTerm';
import { paintHighlights, textOffset, type Highlight } from './highlights';

type Selection = { start: number; end: number; text: string };

type Props = {
  html: string;
  highlights: Highlight[];
  /** Called with the chosen passage when the reader taps "Highlight". */
  onHighlight?: (s: Selection) => void;
};

/**
 * The chapter's story. The HTML is rendered in one piece, then each glossary
 * word is mounted into its placeholder with a portal (splitting the HTML at
 * each word would cut paragraphs and lists apart), and saved highlights are
 * painted over the text.
 */
export const StoryBody = forwardRef<HTMLDivElement | null, Props>(function StoryBody(
  { html, highlights, onHighlight },
  forwarded,
) {
  const ref = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwarded, () => ref.current as HTMLDivElement);
  const [slots, setSlots] = useState<{ el: HTMLElement; term: string }[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('span[data-popover]'));
    els.forEach((el) => {
      el.textContent = '';
    });
    setSlots(els.map((el) => ({ el, term: el.dataset.popover || '' })));
  }, [html]);

  // Paint after the glossary words have mounted, so offsets count their text.
  useEffect(() => {
    if (ref.current) paintHighlights(ref.current, highlights);
  }, [highlights, slots]);

  const readSelection = useCallback(() => {
    const root = ref.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }
    const text = sel.toString().replace(/\s+/g, ' ').trim();
    if (text.length < 3 || text.length > 600) {
      setSelection(null);
      return;
    }
    const start = textOffset(root, range.startContainer, range.startOffset);
    const end = textOffset(root, range.endContainer, range.endOffset);
    setSelection(end > start ? { start, end, text } : null);
  }, []);

  useEffect(() => {
    if (!onHighlight) return;
    let t: number | undefined;
    const onChange = () => {
      window.clearTimeout(t);
      t = window.setTimeout(readSelection, 180);
    };
    document.addEventListener('selectionchange', onChange);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('selectionchange', onChange);
    };
  }, [onHighlight, readSelection]);

  return (
    <>
      <div ref={ref} className="reader-prose" data-testid="chapter-content" dangerouslySetInnerHTML={{ __html: html }} />
      {slots.map((s, i) => createPortal(<GlossaryTerm term={s.term} />, s.el, `${i}-${s.term}`))}
      {onHighlight && selection && (
        <div
          role="toolbar"
          aria-label="Selected text"
          className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-1 rounded-pill border border-reader-rule bg-reader-surface p-1 shadow-paper-thumb">
            <button
              type="button"
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-pill bg-gold px-4 font-bold text-night hover:bg-gold-hover"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onHighlight(selection);
                window.getSelection()?.removeAllRanges();
                setSelection(null);
              }}
              data-testid="button-add-highlight"
            >
              <Highlighter size={18} aria-hidden />
              Highlight
            </button>
            <button
              type="button"
              aria-label="Cancel"
              className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-reader-soft hover:text-reader-accent"
              onClick={() => {
                window.getSelection()?.removeAllRanges();
                setSelection(null);
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
});
