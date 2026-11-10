import { Link } from 'wouter';
import { Check, Lock } from 'lucide-react';
import { CHAPTERS, STORY_CHAPTER_COUNT, chapterMark, isEpilogue } from '@/data/content';
import { ACHIEVEMENTS, getQuizResult, type RewardsSnapshot } from '@/lib/rewards';
import { cn } from '@/lib/utils';

const sectionTitle = 'font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-gold';

/** Four headline numbers, separated by gold hairlines rather than boxed. */
export function StatsRow({ r }: { r: RewardsSnapshot }) {
  const finished = CHAPTERS.filter((c) => !isEpilogue(c) && r.completed.includes(c.id)).length;
  const unlocked = Object.keys(r.unlocked).length;
  const stats = [
    { label: 'Chapters finished', value: finished, of: STORY_CHAPTER_COUNT },
    { label: r.streak === 1 ? 'Day reading streak' : 'Days reading streak', value: r.streak, note: r.readToday ? 'You read today' : r.streak ? 'Read today to keep it' : 'Read today to start one' },
    { label: 'Coins', value: r.coins.totalCoins, note: `${r.coins.totalEarned} earned in all` },
    { label: 'Achievements', value: unlocked, of: ACHIEVEMENTS.length },
  ];
  return (
    <dl className="grid grid-cols-2 border-y border-hairline lg:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            'px-1 py-6 sm:px-6',
            i % 2 === 1 && 'border-l border-hairline',
            i >= 2 && 'border-t border-hairline lg:border-t-0',
            i === 2 && 'lg:border-l',
          )}
          data-testid={`stat-${i}`}
        >
          <dt className="text-[0.875rem] text-cream-3">{s.label}</dt>
          <dd className="mt-1">
            <span className="font-display text-[clamp(2rem,4vw,2.75rem)] font-bold leading-none text-gold [font-variant-numeric:tabular-nums]">
              {s.value}
            </span>
            {s.of !== undefined && <span className="ml-1 text-cream-3">of {s.of}</span>}
            {s.note && <span className="mt-2 block text-[0.875rem] text-cream-3">{s.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ChapterProgress({ r }: { r: RewardsSnapshot }) {
  return (
    <section aria-labelledby="chapters-title">
      <h2 id="chapters-title" className={sectionTitle}>
        Chapters
      </h2>
      <ol className="mt-5 border-b border-hairline">
        {CHAPTERS.map((c) => {
          const done = r.completed.includes(c.id);
          const quiz = getQuizResult(c.quizId);
          return (
            <li key={c.id} className="border-t border-hairline">
              <Link href={`/read/${c.slug}`} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3.5 sm:grid-cols-[2.5rem_1fr_9rem_7rem]">
                <span className={cn('font-display text-[1.2rem] font-bold', done ? 'text-gold' : 'text-gold/75')}>{chapterMark(c)}</span>
                <span className="min-w-0 truncate text-cream group-hover:text-gold">{c.title}</span>
                <span className="hidden text-[0.875rem] text-cream-3 sm:block">
                  {quiz ? `Quiz: ${quiz.score} of ${quiz.total}` : 'Quiz not taken'}
                </span>
                <span className="text-right text-[0.875rem]">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-gold">
                      <Check size={15} aria-hidden /> Finished
                    </span>
                  ) : (
                    <span className="text-cream-3">Not yet</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Achievements({ r }: { r: RewardsSnapshot }) {
  return (
    <section aria-labelledby="achievements-title">
      <h2 id="achievements-title" className={sectionTitle}>
        Achievements
      </h2>
      <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const date = r.unlocked[a.id];
          const have = Math.min(r.stats[a.stat], a.requirement);
          return (
            <li key={a.id} className="flex gap-4 border-t border-hairline py-4" data-testid={`achievement-${a.id}`}>
              <span
                className={cn(
                  'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                  date ? 'border-gold bg-gold/15 text-gold' : 'border-hairline text-cream-3',
                )}
                aria-hidden
              >
                {date ? <Check size={17} /> : <Lock size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('font-bold', date ? 'text-gold' : 'text-cream')}>{a.name}</p>
                <p className="text-[0.9375rem] text-cream-2">{a.description}</p>
                {date ? (
                  <p className="mt-1 text-[0.8125rem] text-cream-3">Unlocked {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="h-[3px] flex-1 overflow-hidden rounded-full bg-hairline"
                      role="progressbar"
                      aria-label={`${a.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={a.requirement}
                      aria-valuenow={have}
                    >
                      <div className="h-full origin-left bg-gold/70" style={{ transform: `scaleX(${have / a.requirement})` }} />
                    </div>
                    <span className="text-[0.8125rem] text-cream-3 [font-variant-numeric:tabular-nums]">
                      {have}/{a.requirement}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CoinsLedger({ r }: { r: RewardsSnapshot }) {
  const recent = r.coins.transactions.slice(0, 8);
  return (
    <section aria-labelledby="coins-title">
      <h2 id="coins-title" className={sectionTitle}>
        Coins
      </h2>
      <p className="mt-3 max-w-measure text-cream-2">
        You earn coins by finishing chapters, taking quizzes, playing the money games and reading on more days in a
        row. Spend them on keepsakes from the story, below.
      </p>
      {recent.length === 0 ? (
        <p className="mt-5 text-cream-3">No coins yet. Finish a chapter to earn your first ones.</p>
      ) : (
        <ul className="mt-5 border-b border-hairline">
          {recent.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-4 border-t border-hairline py-3">
              <span className="text-cream-2">{t.reason}</span>
              <span className={cn('font-bold [font-variant-numeric:tabular-nums]', t.type === 'earned' ? 'text-gold' : 'text-cream-3')}>
                {t.type === 'earned' ? '+' : '−'}
                {t.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
