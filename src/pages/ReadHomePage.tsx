import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { PageShell, PageIntro } from '@/components/site/PageShell';
import { LinkButton } from '@/components/site/GoldButton';
import {
  ART_HEIGHT,
  ART_WIDTH,
  CHAPTERS,
  STORY_CHAPTER_COUNT,
  chapterArt,
  chapterMark,
  getChapter,
  isEpilogue,
  type Chapter,
} from '@/data/content';
import { CHARACTERS, setGuide, useGuideId, type GuideId } from '@/data/characters';
import { useRewards } from '@/lib/rewards';
import { cn } from '@/lib/utils';

function useResumeChapter() {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    try {
      setSlug(localStorage.getItem('resumeSlug'));
    } catch {
      setSlug(null);
    }
  }, []);
  return getChapter(slug ?? undefined);
}

export default function ReadHomePage() {
  const { completed } = useRewards();
  const resume = useResumeChapter();
  const finished = CHAPTERS.filter((c) => !isEpilogue(c) && completed.includes(c.id)).length;
  const nextUp = resume ?? CHAPTERS.find((c) => !completed.includes(c.id)) ?? CHAPTERS[0];

  return (
    <PageShell title="Read the book">
      <PageIntro
        title="Read the book"
        lead="Twelve chapters and an epilogue. Read them in order or start anywhere. Every chapter ends with a family challenge, a conversation to have at home, and a short quiz."
      />

      <section aria-labelledby="continue-title" className="mx-auto max-w-container px-5 sm:px-8">
        <h2 id="continue-title" className="sr-only">
          {resume ? 'Continue reading' : 'Start reading'}
        </h2>
        <ContinueCard chapter={nextUp} resuming={!!resume} />
        <div className="mt-6 flex items-center gap-4 text-[0.875rem] text-cream-3">
          <div className="h-[3px] w-40 overflow-hidden rounded-full bg-hairline" aria-hidden>
            <div
              className="h-full origin-left bg-gold"
              style={{ transform: `scaleX(${finished / STORY_CHAPTER_COUNT})` }}
            />
          </div>
          <p>
            {finished} of {STORY_CHAPTER_COUNT} chapters finished
          </p>
        </div>
      </section>

      <div className="mx-auto mt-16 grid max-w-container gap-16 px-5 pb-24 sm:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
        <section aria-labelledby="chapters-title">
          <h2 id="chapters-title" className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-gold">
            Contents
          </h2>
          <ol className="mt-6 border-b border-hairline">
            {CHAPTERS.map((c) => (
              <ChapterRow key={c.id} chapter={c} done={completed.includes(c.id)} current={c.id === resume?.id} />
            ))}
          </ol>
        </section>

        <aside aria-labelledby="guide-title" className="lg:sticky lg:top-[100px] lg:self-start">
          <GuidePicker />
        </aside>
      </div>
    </PageShell>
  );
}

function ContinueCard({ chapter, resuming }: { chapter: Chapter; resuming: boolean }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-5 sm:grid-cols-[112px_1fr] sm:gap-x-7">
      <img
        src={chapterArt(chapter)}
        alt=""
        width={ART_WIDTH}
        height={ART_HEIGHT}
        className="w-full rounded-plate bg-night-3 shadow-plate"
      />
      <div className="min-w-0">
        <p className="text-[0.875rem] text-cream-3">
          {resuming ? 'Pick up where you left off' : 'Start here'} · {isEpilogue(chapter) ? 'Epilogue' : chapter.label}
        </p>
        <p className="mt-1 font-display text-[clamp(1.25rem,2.2vw,1.6rem)] font-semibold leading-tight text-cream">
          {chapter.title}
        </p>
      </div>
      <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:-mt-2">
          <LinkButton href={`/read/${chapter.slug}`} data-testid={resuming ? 'button-resume' : 'button-start-first'}>
            {resuming ? 'Continue reading' : 'Start reading'}
            <ArrowRight size={18} aria-hidden />
          </LinkButton>
      </div>
    </div>
  );
}

function ChapterRow({ chapter, done, current }: { chapter: Chapter; done: boolean; current: boolean }) {
  return (
    <li className="border-t border-hairline">
      <Link
        href={`/read/${chapter.slug}`}
        className="group grid grid-cols-[1.6rem_56px_1fr] items-center gap-3 py-4 sm:grid-cols-[3rem_56px_1fr_auto] sm:gap-5"
        aria-current={current ? 'location' : undefined}
        data-testid={`link-chapter-${chapter.slug}`}
      >
        <span
          className={cn(
            'font-display text-[1.35rem] font-bold sm:text-[1.6rem]',
            current ? 'text-gold' : 'text-gold/55 group-hover:text-gold',
          )}
        >
          {chapterMark(chapter)}
        </span>
        <img
          src={chapterArt(chapter)}
          alt=""
          width={56}
          height={72}
          loading="lazy"
          decoding="async"
          className="h-[72px] w-14 rounded-thumb bg-night-3 object-cover shadow-paper-thumb"
        />
        <span className="min-w-0">
          <span className="block font-display text-[clamp(1.05rem,1.5vw,1.25rem)] font-semibold leading-snug text-cream group-hover:text-gold">
            {chapter.title}
          </span>
          <span className="mt-1 line-clamp-2 block text-[0.9375rem] leading-[1.5] text-cream-3">{chapter.summary}</span>
          <span className="mt-1.5 flex items-center gap-2 text-[0.875rem] text-cream-3 sm:hidden">
            {chapter.estReadMinutes} min
            {done && (
              <span className="inline-flex items-center gap-1 text-gold">
                <Check size={14} aria-hidden /> Finished
              </span>
            )}
          </span>
        </span>
        <span className="hidden w-24 text-right text-[0.875rem] text-cream-3 sm:block">
          {done ? (
            <span className="inline-flex items-center gap-1 text-gold">
              <Check size={15} aria-hidden /> Finished
            </span>
          ) : (
            `${chapter.estReadMinutes} min`
          )}
        </span>
      </Link>
    </li>
  );
}

function GuidePicker() {
  const guide = useGuideId();
  return (
    <div>
      <h2 id="guide-title" className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-gold">
        Your reading guide
      </h2>
      <p className="mt-3 max-w-measure leading-[1.6] text-cream-2">
        Pick who reads with you. Your guide's tips come first in each chapter's lesson.
      </p>
      <div className="mt-5 grid gap-2" role="radiogroup" aria-labelledby="guide-title">
        {CHARACTERS.map((c) => {
          const selected = guide === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setGuide(c.id as GuideId)}
              className="flex items-center gap-4 rounded-choice px-4 py-3 text-left hover:bg-white/[0.03] aria-checked:bg-gold/[0.09]"
              data-testid={`guide-${c.id}`}
            >
              <img
                src={c.image}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-full object-cover object-top ring-1 ring-gold/30"
              />
              <span className="flex-1">
                <span className={cn('block font-display text-[1.12rem] font-semibold', selected ? 'text-gold' : 'text-cream')}>
                  {c.name}
                </span>
                <span className="block text-[0.9375rem] text-cream-2">{c.speciality}</span>
              </span>
              {selected && <Check size={20} className="text-gold" aria-hidden />}
            </button>
          );
        })}
      </div>
      <Link href="/characters" className="mt-4 inline-block text-[0.9375rem] text-cream-2 underline decoration-gold/40 underline-offset-4 hover:text-gold">
        Meet Renee and Alex
      </Link>
    </div>
  );
}
