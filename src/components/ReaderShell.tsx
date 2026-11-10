import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { MotionConfig, motion, useScroll, useSpring } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { Check, List, Minus, Plus, Type, X } from 'lucide-react';
import { CHAPTERS, chapterMark } from '@/data/content';
import { READER_THEMES, TEXT_SIZES, setTheme, stepTextSize, useReaderPrefs } from '@/lib/readerPrefs';
import { useRewards } from '@/lib/rewards';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  currentSlug?: string;
  /** Extra buttons for the reading bar (the chapter page adds Tools). */
  actions?: ReactNode;
};

const barButton =
  'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-3 text-reader-soft hover:text-reader-accent aria-expanded:text-reader-accent';

/** Read mode: the book's sky (or paper), a quiet reading bar, and the chapter list. */
export default function ReaderShell({ children, currentSlug, actions }: Props) {
  const { theme, size } = useReaderPrefs();

  // The theme lives on <html> so menus and popovers rendered outside this
  // tree read the same colours.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.readerTheme = theme;
    html.style.setProperty('--r-size', `${size}px`);
    return () => {
      delete html.dataset.readerTheme;
      html.style.removeProperty('--r-size');
    };
  }, [theme, size]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-reader-bg text-reader-ink">
        <a
          href="#main"
          className="sr-only z-50 rounded-pill bg-gold px-4 py-2 font-bold text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-30 border-b border-reader-rule bg-[var(--r-bar)] backdrop-blur-xl supports-[not(backdrop-filter:blur(1px))]:bg-reader-bg">
          <nav aria-label="Reader" className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-1 px-3 sm:px-6">
            <ContentsMenu currentSlug={currentSlug} />
            <Link
              href="/"
              className="ml-1 mr-auto truncate whitespace-nowrap font-display text-[0.95rem] font-bold text-reader-accent sm:text-[1.0625rem]"
            >
              The Money Tree of Life
            </Link>
            {actions}
            <DisplayMenu />
          </nav>
          <ScrollLine />
        </header>
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
      </div>
    </MotionConfig>
  );
}

function ScrollLine() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-reader-accent"
      style={{ scaleX }}
    />
  );
}

function ContentsMenu({ currentSlug }: { currentSlug?: string }) {
  const [open, setOpen] = useState(false);
  const { completed } = useRewards();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={barButton} aria-label="Chapters" data-testid="button-toggle-chapters">
        <List size={20} aria-hidden />
        <span className="hidden sm:inline">Chapters</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-night/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(92vw,400px)] flex-col border-r border-reader-rule bg-reader-surface text-reader-ink data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Dialog.Title className="font-display text-[1.15rem] font-bold text-reader-accent">Contents</Dialog.Title>
            <Dialog.Close className={barButton} aria-label="Close chapters">
              <X size={20} aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Every chapter of the book</Dialog.Description>
          <ol className="flex-1 overflow-y-auto px-3 pb-6">
            <li>
              <Link
                href="/read"
                onClick={() => setOpen(false)}
                className="flex min-h-[3rem] items-center rounded-choice px-3 text-reader-soft hover:bg-reader-wash hover:text-reader-accent"
              >
                All chapters and your place
              </Link>
            </li>
            {CHAPTERS.map((c) => {
              const current = c.slug === currentSlug;
              const done = completed.includes(c.id);
              return (
                <li key={c.id}>
                  <Link
                    href={`/read/${c.slug}`}
                    onClick={() => setOpen(false)}
                    aria-current={current ? 'page' : undefined}
                    className="grid min-h-[3.25rem] grid-cols-[2rem_1fr_1.25rem] items-center gap-2 rounded-choice px-3 py-2 hover:bg-reader-wash aria-[current=page]:bg-reader-wash"
                    data-testid={`chapter-link-${c.slug}`}
                  >
                    <span className={cn('font-display font-bold', current ? 'text-reader-accent' : 'text-reader-quiet')}>
                      {chapterMark(c)}
                    </span>
                    <span className={cn('leading-snug', current ? 'text-reader-accent' : 'text-reader-ink')}>{c.title}</span>
                    {done && (
                      <Check size={18} className="text-reader-accent" aria-label="Finished" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DisplayMenu() {
  const { theme, size } = useReaderPrefs();
  const smallest = size <= TEXT_SIZES[0];
  const largest = size >= TEXT_SIZES[TEXT_SIZES.length - 1];

  return (
    <Popover.Root>
      <Popover.Trigger className={barButton} aria-label="Text and colours" data-testid="button-display">
        <Type size={20} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-plate border border-reader-rule bg-reader-surface p-4 text-reader-ink shadow-paper-thumb data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <p id="theme-label" className="text-[0.875rem] text-reader-quiet">
            Page colour
          </p>
          <div role="radiogroup" aria-labelledby="theme-label" className="mt-2 grid gap-1.5">
            {READER_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={theme === t.id}
                onClick={() => setTheme(t.id)}
                className="flex min-h-[2.75rem] items-center gap-3 rounded-choice px-3 text-left hover:bg-reader-wash aria-checked:bg-reader-wash aria-checked:text-reader-accent"
                data-testid={`theme-${t.id}`}
              >
                <span
                  aria-hidden
                  className={cn(
                    'h-6 w-6 shrink-0 rounded-full border',
                    t.id === 'night' && 'border-[rgba(230,185,85,0.5)] bg-night',
                    t.id === 'paper' && 'border-[#c8bda5] bg-paper',
                    t.id === 'contrast' && 'border-white bg-black',
                  )}
                />
                <span className="flex-1">
                  <span className="block font-bold">{t.label}</span>
                  <span className="block text-[0.8125rem] text-reader-quiet">{t.hint}</span>
                </span>
                {theme === t.id && <Check size={18} aria-hidden />}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[0.875rem] text-reader-quiet" id="size-label">
            Text size
          </p>
          <div className="mt-2 flex items-center justify-between gap-2" role="group" aria-labelledby="size-label">
            <button
              type="button"
              onClick={() => stepTextSize(size, -1)}
              disabled={smallest}
              aria-label="Smaller text"
              className="inline-flex h-11 w-11 items-center justify-center rounded-pill border border-reader-rule hover:border-reader-accent hover:text-reader-accent disabled:opacity-40"
              data-testid="button-decrease-font-size"
            >
              <Minus size={18} aria-hidden />
            </button>
            <span className="flex-1 text-center" aria-live="polite">
              <span style={{ fontSize: size }}>Aa</span>
              <span className="sr-only"> {size} pixels</span>
            </span>
            <button
              type="button"
              onClick={() => stepTextSize(size, 1)}
              disabled={largest}
              aria-label="Larger text"
              className="inline-flex h-11 w-11 items-center justify-center rounded-pill border border-reader-rule hover:border-reader-accent hover:text-reader-accent disabled:opacity-40"
              data-testid="button-increase-font-size"
            >
              <Plus size={18} aria-hidden />
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
