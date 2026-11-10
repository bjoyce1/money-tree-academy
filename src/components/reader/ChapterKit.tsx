import { useEffect, useState } from 'react';
import { Check, MessageCircle } from 'lucide-react';
import { findTerm, type Chapter, type ChapterKit as Kit } from '@/data/content';
import { recordActivity } from '@/lib/rewards';
import { useGuideId } from '@/data/characters';

const challengeKey = (chapterId: string) => `activities_${chapterId}`;

function useChallengeDone(chapterId: string) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    try {
      setDone(localStorage.getItem(challengeKey(chapterId)) === 'done');
    } catch {
      setDone(false);
    }
  }, [chapterId]);
  const toggle = () => {
    const next = !done;
    setDone(next);
    try {
      if (next) {
        const first = localStorage.getItem(challengeKey(chapterId)) === null;
        localStorage.setItem(challengeKey(chapterId), 'done');
        if (first) recordActivity('activity-completed');
      } else {
        localStorage.setItem(challengeKey(chapterId), 'undone');
      }
    } catch {
      /* ignore */
    }
  };
  return [done, toggle] as const;
}

const partTitle = 'font-display text-[1.15em] font-bold leading-tight text-reader-accent';

/** The book's end-of-chapter kit, set as the chapter's practice section. */
export function ChapterKit({ chapter, kit }: { chapter: Chapter; kit: Kit }) {
  const [done, toggleDone] = useChallengeDone(chapter.id);
  const guide = useGuideId();
  const tips = [
    <Tip key="renee" who="Renee" title="Renee's saving tip" text={kit.reneeTip} img="/characters/renee.webp" />,
    <Tip key="alex" who="Alex" title="Alex's wealth builder tip" text={kit.alexTip} img="/characters/alex.webp" />,
  ];
  if (guide === 'alex') tips.reverse();

  return (
    <section aria-labelledby="kit-title" className="text-[length:var(--r-size)] leading-[1.65] text-reader-soft">
      <h2 id="kit-title" className="font-display text-[1.5em] font-bold leading-tight text-reader-accent">
        Money Tree Lessons
      </h2>
      <p className="mt-4 text-pretty text-[1.3em] font-bold leading-[1.4] text-reader-ink">{kit.lesson}</p>

      <div className="mt-10 border-t border-reader-rule pt-8">
        <h3 className={partTitle}>New money words</h3>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {kit.words.map((w) => {
            const entry = findTerm(w);
            return (
              <div key={w}>
                <dt className="font-bold text-reader-ink">{w}</dt>
                {entry && <dd className="mt-0.5 text-[0.92em] leading-[1.5] text-reader-quiet">{entry.shortDefinition}</dd>}
              </div>
            );
          })}
        </dl>
      </div>

      <div className="mt-10 grid gap-8 border-t border-reader-rule pt-8 sm:grid-cols-2 sm:gap-10">
        {tips}
      </div>

      <div className="mt-10 border-t border-reader-rule pt-8">
        <h3 className={partTitle}>Money Tree Challenge</h3>
        <p className="mt-3 max-w-measure text-reader-ink">{kit.challenge}</p>
        <button
          type="button"
          aria-pressed={done}
          onClick={toggleDone}
          className="mt-5 inline-flex min-h-[2.75rem] items-center gap-2 rounded-pill border border-reader-rule px-4 text-[0.875em] font-bold text-reader-ink hover:border-reader-accent hover:text-reader-accent aria-pressed:border-reader-accent aria-pressed:bg-reader-wash aria-pressed:text-reader-accent"
          data-testid="button-challenge-done"
        >
          <span
            aria-hidden
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current"
          >
            {done && <Check size={13} strokeWidth={3} />}
          </span>
          {done ? 'We did this challenge' : 'Mark the challenge as done'}
        </button>
      </div>

      <div className="mt-10 border-t border-reader-rule pt-8">
        <h3 className={partTitle}>Family conversation</h3>
        <p className="mt-3 flex max-w-measure gap-3 text-[1.1em] text-reader-ink">
          <MessageCircle size={22} aria-hidden className="mt-1 shrink-0 text-reader-accent" />
          <span>{kit.conversation}</span>
        </p>
      </div>

      <div className="mt-10 border-t border-reader-rule pt-8">
        <h3 className={partTitle}>Quick review</h3>
        <p className="mt-3 max-w-measure">{kit.review}</p>
      </div>

      <details className="group mt-10 border-y border-reader-rule py-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-reader-ink hover:text-reader-accent [&::-webkit-details-marker]:hidden">
          A note for parents and caregivers
          <span aria-hidden className="text-reader-accent transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <p className="mt-3 max-w-measure">{kit.parentNote}</p>
      </details>
    </section>
  );
}

function Tip({ who, title, text, img }: { who: string; title: string; text: string; img: string }) {
  return (
    <figure className="flex gap-4">
      <img
        src={img}
        alt={who}
        width={56}
        height={56}
        loading="lazy"
        className="h-14 w-14 shrink-0 rounded-full object-cover object-top ring-1 ring-[var(--r-rule)]"
      />
      <div>
        <figcaption className={partTitle}>{title}</figcaption>
        <blockquote className="mt-2 text-reader-ink">{text}</blockquote>
      </div>
    </figure>
  );
}
