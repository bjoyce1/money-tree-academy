import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Headphones, NotebookPen, Pause, Play } from 'lucide-react';
import ReaderShell from '@/components/ReaderShell';
import { StoryBody } from '@/components/reader/StoryBody';
import { ChapterKit } from '@/components/reader/ChapterKit';
import { ChapterQuiz } from '@/components/reader/ChapterQuiz';
import { ChapterGame } from '@/components/reader/ChapterGame';
import { ToolsDrawer, type ToolId } from '@/components/reader/ToolsDrawer';
import { useSpeech } from '@/components/reader/ListenTool';
import {
  ART_HEIGHT,
  ART_WIDTH,
  CHAPTERS,
  STORY_CHAPTER_COUNT,
  chapterArt,
  getChapter,
  isEpilogue,
  storyHtml,
  storyText,
  type Chapter,
} from '@/data/content';
import { flipbookHref } from '@/flipbook/chapters';
import { useAuth } from '@/hooks/useAuth';
import { progressAPI } from '@/lib/api';
import { completeChapter, recordActivity, recordReadingDay, useRewards } from '@/lib/rewards';
import { addHighlight, setAccountSync, useHighlightsList } from '@/lib/study';

export default function ChapterPage() {
  const { slug } = useParams<{ slug: string }>();
  const chapter = getChapter(slug);

  if (!chapter) {
    return (
      <ReaderShell>
        <div className="mx-auto max-w-[44rem] px-5 py-24 sm:px-8">
          <h1 className="font-display text-[2rem] font-bold text-reader-accent">That chapter isn't here.</h1>
          <p className="mt-4 text-reader-soft">The link may be old. Every chapter is listed on the reader's home page.</p>
          <Link href="/read" className="mt-6 inline-block font-bold text-reader-accent underline underline-offset-4" data-testid="link-back-to-read">
            See all chapters
          </Link>
        </div>
      </ReaderShell>
    );
  }
  // Keyed so every chapter starts with fresh state (quiz, tools, listening).
  return <ChapterView key={chapter.id} chapter={chapter} />;
}

const barButton =
  'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-3 text-reader-soft hover:text-reader-accent';

function ChapterView({ chapter }: { chapter: Chapter }) {
  const html = useMemo(() => storyHtml(chapter), [chapter]);
  const text = useMemo(() => storyText(chapter), [chapter]);
  const highlights = useHighlightsList(chapter.id);
  const speech = useSpeech(text);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const toolsButton = useRef<HTMLButtonElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [tool, setTool] = useState<ToolId>('notes');
  const { isAuthenticated } = useAuth();

  const index = CHAPTERS.indexOf(chapter);
  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];

  useEffect(() => {
    document.title = `${chapter.title} · The Money Tree of Life`;
    try {
      localStorage.setItem('resumeSlug', chapter.slug);
    } catch {
      /* ignore */
    }
  }, [chapter]);

  useEffect(() => {
    setAccountSync(isAuthenticated);
    if (isAuthenticated) progressAPI.update(chapter.slug).catch(() => undefined);
  }, [isAuthenticated, chapter.slug]);

  useReadingTime();

  const getPlace = useCallback(() => {
    const el = storyRef.current;
    if (!el) return { position: 0, excerpt: '' };
    const rect = el.getBoundingClientRect();
    const position = Math.min(100, Math.max(0, ((80 - rect.top) / rect.height) * 100));
    const para = Array.from(el.querySelectorAll('p, li')).find((p) => p.getBoundingClientRect().top >= 80);
    return { position, excerpt: (para?.textContent || '').trim().slice(0, 140) };
  }, []);

  const jumpTo = useCallback(({ position, highlightId }: { position?: number; highlightId?: string }) => {
    setToolsOpen(false);
    // Wait for the drawer to close so focus and scrolling land on the story.
    window.setTimeout(() => {
      if (highlightId) {
        document.querySelector(`mark[data-highlight-id="${highlightId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      const el = storyRef.current;
      if (el && position !== undefined) {
        const top = el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight * position) / 100 - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 60);
  }, []);

  const openTool = (t: ToolId) => {
    setTool(t);
    setToolsOpen(true);
  };

  const actions = (
    <>
      {speech.state !== 'idle' && (
        <button
          type="button"
          className={barButton}
          onClick={speech.state === 'playing' ? speech.pause : speech.resume}
          aria-label={speech.state === 'playing' ? 'Pause reading aloud' : 'Resume reading aloud'}
        >
          <Headphones size={18} aria-hidden />
          {speech.state === 'playing' ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
      )}
      <button ref={toolsButton} type="button" className={barButton} onClick={() => openTool(tool)} aria-label="Study tools" aria-haspopup="dialog" aria-expanded={toolsOpen} data-testid="button-tools">
        <NotebookPen size={19} aria-hidden />
        <span className="hidden sm:inline">Tools</span>
      </button>
    </>
  );

  return (
    <ReaderShell currentSlug={chapter.slug} actions={actions}>
      <article className="mx-auto max-w-[44rem] px-5 pb-24 sm:px-8" aria-labelledby="chapter-title">
        <header className="grid grid-cols-[1fr_auto] items-end gap-5 pt-10 sm:gap-8 sm:pt-16">
          <div>
            <p className="text-[0.95rem] text-reader-quiet">
              {isEpilogue(chapter) ? 'Epilogue' : `Chapter ${chapter.order} of ${STORY_CHAPTER_COUNT}`}
            </p>
            <h1
              id="chapter-title"
              className="mt-2 text-balance font-display text-[clamp(1.75rem,4.4vw,2.75rem)] font-bold leading-[1.12] text-reader-accent"
              data-testid="chapter-title"
            >
              {chapter.title}
            </h1>
            <p className="mt-4 text-[0.95rem] text-reader-quiet">
              {chapter.estReadMinutes} min read
              <span aria-hidden> · </span>
              <Link href={flipbookHref(chapter.printedPage)} className="underline decoration-[var(--r-rule)] underline-offset-4 hover:text-reader-accent">
                Page {chapter.printedPage} in the book
              </Link>
            </p>
          </div>
          <img
            src={chapterArt(chapter)}
            alt=""
            width={ART_WIDTH}
            height={ART_HEIGHT}
            className="w-[88px] rounded-plate bg-night-3 shadow-plate sm:w-[148px]"
            {...({ fetchpriority: 'high' } as object)}
          />
        </header>

        <div className="mt-9 border-t border-reader-rule pt-9 sm:mt-12 sm:pt-12">
          <StoryBody
            ref={storyRef}
            html={html}
            highlights={highlights}
            onHighlight={(s) =>
              addHighlight({ chapterId: chapter.id, startOffset: s.start, endOffset: s.end, text: s.text, color: 'gold' })
            }
          />
        </div>

        <EndOfStory chapter={chapter} />

        {chapter.kit && (
          <div className="mt-16">
            <ChapterKit chapter={chapter} kit={chapter.kit} />
          </div>
        )}

        <div className="mt-16 border-t border-reader-rule pt-12">
          <ChapterQuiz quizId={chapter.quizId} />
        </div>

        <ChapterGame slug={chapter.slug} />

        <nav aria-label="Chapters" className="mt-20 grid gap-3 border-t border-reader-rule pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/read/${prev.slug}`}
              className="group flex min-h-[4.5rem] flex-col justify-center rounded-choice px-1 hover:text-reader-accent"
              data-testid="link-previous"
            >
              <span className="inline-flex items-center gap-1.5 text-[0.875rem] text-reader-quiet">
                <ArrowLeft size={15} aria-hidden /> Previous
              </span>
              <span className="mt-1 font-display text-[1.1rem] font-semibold leading-snug">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/read/${next.slug}`}
              className="group flex min-h-[4.5rem] flex-col justify-center rounded-choice px-1 text-right hover:text-reader-accent sm:items-end"
              data-testid="link-next"
            >
              <span className="inline-flex items-center gap-1.5 self-end text-[0.875rem] text-reader-quiet">
                Next <ArrowRight size={15} aria-hidden />
              </span>
              <span className="mt-1 font-display text-[1.1rem] font-semibold leading-snug">{next.title}</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex min-h-[4.5rem] flex-col justify-center px-1 text-right hover:text-reader-accent sm:items-end">
              <span className="text-[0.875rem] text-reader-quiet">You reached the end</span>
              <span className="mt-1 font-display text-[1.1rem] font-semibold">See your progress</span>
            </Link>
          )}
        </nav>
      </article>

      <ToolsDrawer
        chapter={chapter}
        open={toolsOpen}
        onOpenChange={setToolsOpen}
        tab={tool}
        onTabChange={setTool}
        getPlace={getPlace}
        onJumpTo={jumpTo}
        speech={speech}
        returnFocusTo={toolsButton}
      />
    </ReaderShell>
  );
}

/** Reaching the end of the story finishes the chapter. */
function EndOfStory({ chapter }: { chapter: Chapter }) {
  const ref = useRef<HTMLDivElement>(null);
  const { completed } = useRewards();
  const done = completed.includes(chapter.id);
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && completeChapter(chapter.id, chapter.label)) setJustFinished(true);
      },
      { rootMargin: '0px 0px -20% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [chapter, done]);

  return (
    <div ref={ref} className="mt-14 flex flex-col items-center gap-3 text-center" aria-live="polite">
      <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden className="text-reader-accent">
        <path
          fill="currentColor"
          d="M12 2c-3.5 3-6 6.4-6 10.2C6 16 8.6 19 12 19.8V22h1v-2.2c3.2-.9 5-3.8 5-7.6C18 8.4 15.5 5 12 2zm.5 16.7V9h-1v9.7c-2.6-.8-4.5-3.3-4.5-6.5 0-3.1 1.9-6 5-8.9 3.1 2.9 5 5.8 5 8.9 0 3.2-1.9 5.7-4.5 6.5z"
        />
      </svg>
      {done && (
        <p className="text-[0.95rem] text-reader-quiet">
          {justFinished ? `You finished ${isEpilogue(chapter) ? 'the epilogue' : chapter.label}. Nice reading!` : 'You have finished this chapter.'}
        </p>
      )}
    </div>
  );
}

/** Time spent reading counts toward the streak and the reading-time achievement. */
function useReadingTime() {
  useEffect(() => {
    let seconds = 0;
    let countedDay = false;
    const tick = window.setInterval(() => {
      if (document.hidden) return;
      seconds += 5;
      if (!countedDay && seconds >= 30) {
        countedDay = true;
        recordReadingDay();
      }
      if (seconds % 60 === 0) recordActivity('reading-time', { minutes: 1 });
    }, 5000);
    return () => window.clearInterval(tick);
  }, []);
}
