import { PageShell, PageIntro } from '@/components/site/PageShell';
import { LinkButton } from '@/components/site/GoldButton';
import { Achievements, ChapterProgress, CoinsLedger, StatsRow } from '@/components/progress/ProgressParts';
import { MoneyGames } from '@/components/progress/MoneyGames';
import { Keepsakes } from '@/components/progress/Keepsakes';
import { CHAPTERS, getChapter } from '@/data/content';
import { useRewards } from '@/lib/rewards';
import { ArrowRight } from 'lucide-react';

function resumeChapter() {
  try {
    return getChapter(localStorage.getItem('resumeSlug') ?? undefined);
  } catch {
    return undefined;
  }
}

const sectionTitle = 'font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-gold';

/** "Your progress": everything the reader has earned, and the games and shop to use it in. */
export default function DashboardPage() {
  const r = useRewards();
  const next = resumeChapter() ?? CHAPTERS.find((c) => !r.completed.includes(c.id)) ?? CHAPTERS[0];

  return (
    <PageShell title="Your progress">
      <PageIntro title="Your progress" lead="Chapters you have finished, your reading streak, coins and achievements. Everything is saved in this browser.">
        <div className="mt-7">
          <LinkButton href={`/read/${next.slug}`} className="whitespace-normal py-3 text-left">
            Keep reading: {next.title} <ArrowRight size={18} aria-hidden className="shrink-0" />
          </LinkButton>
        </div>
      </PageIntro>

      <div className="mx-auto max-w-container space-y-20 px-5 pb-24 sm:px-8">
        <StatsRow r={r} />
        <div className="grid gap-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <ChapterProgress r={r} />
          <CoinsLedger r={r} />
        </div>
        <Achievements r={r} />

        <section aria-labelledby="games-title">
          <h2 id="games-title" className={sectionTitle}>
            Money games
          </h2>
          <p className="mt-3 max-w-measure text-cream-2">Practise the book's ideas. Each game earns coins once a day.</p>
          <div className="mt-6">
            <MoneyGames />
          </div>
        </section>

        <section aria-labelledby="shop-title">
          <h2 id="shop-title" className={sectionTitle}>
            Keepsakes
          </h2>
          <div className="mt-3">
            <Keepsakes />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
