import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { gamesForChapter } from '@/lib/games';

/**
 * "Play this chapter": a way from the chapter to the game that practises it.
 * It sits after the quiz, outside the book's own kit, and follows the reading theme.
 */
export function ChapterGame({ slug }: { slug: string }) {
  const games = gamesForChapter(slug);
  if (!games.length) return null;

  return (
    <section aria-labelledby="play-title" className="mt-16 border-t border-reader-rule pt-12 text-[length:var(--r-size)] leading-[1.65] text-reader-soft">
      <h2 id="play-title" className="font-display text-[1.5em] font-bold leading-tight text-reader-accent">
        Play this chapter
      </h2>
      {games.map((g) => (
        <div key={g.id} className="mt-4">
          <p className="max-w-measure">
            <strong className="text-reader-ink">{g.name}.</strong> {g.about}
          </p>
          <Link
            href={g.href!}
            className="mt-5 inline-flex min-h-[2.75rem] items-center gap-2 rounded-pill border border-reader-rule px-5 text-[0.875em] font-bold text-reader-ink hover:border-reader-accent hover:text-reader-accent"
            data-testid={`chapter-game-${g.id}`}
          >
            Play {g.name} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      ))}
    </section>
  );
}
