import { lazy, Suspense, useState } from 'react';
import { Link } from 'wouter';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, X } from 'lucide-react';
import { GAMES, useBestScores, type GameId } from '@/lib/games';
import { CHAPTERS } from '@/data/content';
import { SortGame } from './games/SortGame';
import { SavingsGame } from './games/SavingsGame';
import { PartyGame } from './games/PartyGame';
import { MatchGame } from './games/MatchGame';
import { LinkButton } from '@/components/site/GoldButton';

// The live tree is only drawn once this section is on the page.
const TreeScene = lazy(() => import('@/play/TreeScene').then((m) => ({ default: m.TreeScene })));

const BOARDS: Partial<Record<GameId, (p: { onClose: () => void }) => JSX.Element>> = {
  'every-dollar': SortGame,
  'how-long': SavingsGame,
  'class-party': PartyGame,
  'money-words': MatchGame,
};

/** Grow the Tree has a page of its own; the four quick games each open in a dialog. */
export function MoneyGames() {
  const best = useBestScores();
  const [open, setOpen] = useState<GameId | null>(null);
  const game = GAMES.find((g) => g.id === open);
  const Board = open ? BOARDS[open] : null;
  const featured = GAMES.filter((g) => g.href);

  return (
    <>
      {featured.map((g) => (
        <div key={g.id} className="mb-10 grid items-center gap-6 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-plate bg-night shadow-plate">
            <Suspense fallback={null}>
              <TreeScene size={0.82} gold={0.28} weather="calm" className="absolute inset-0 h-full w-full" />
            </Suspense>
          </div>
          <div>
            <h3 className="font-display text-[clamp(1.4rem,2.4vw,1.8rem)] font-bold leading-tight text-cream">{g.name}</h3>
            <p className="mt-2 max-w-measure text-cream-2">{g.about}</p>
            <p className="mt-1.5 text-[0.875rem] text-cream-3">
              {best[g.id] !== undefined ? `Best: ${best[g.id]}%` : 'Not played yet'} · Goes with Chapters 5 and 9
            </p>
            <div className="mt-5">
              <LinkButton href={g.href!} variant="outline" data-testid={`game-${g.id}`}>
                Play {g.name} <ArrowRight size={18} aria-hidden />
              </LinkButton>
            </div>
          </div>
        </div>
      ))}

      <ul className="grid gap-x-10 border-b border-hairline sm:grid-cols-2 sm:border-b-0">
        {GAMES.filter((g) => !g.href).map((g) => {
          const chapter = CHAPTERS.find((c) => c.slug === g.chapter);
          return (
            <li key={g.id} className="border-t border-hairline sm:border-b">
              <button
                type="button"
                onClick={() => setOpen(g.id)}
                className="group flex w-full items-center gap-4 py-5 text-left"
                data-testid={`game-${g.id}`}
              >
                <span className="flex-1">
                  <span className="block font-display text-[1.2rem] font-semibold text-cream group-hover:text-gold">{g.name}</span>
                  <span className="mt-1 block text-cream-2">{g.about}</span>
                  <span className="mt-1.5 block text-[0.875rem] text-cream-3">
                    {best[g.id] !== undefined ? `Best: ${best[g.id]}%` : 'Not played yet'}
                    {chapter && ` · Goes with ${chapter.label}`}
                  </span>
                </span>
                <ArrowRight size={20} aria-hidden className="shrink-0 text-gold/70 group-hover:text-gold" />
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-night/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-plate border-t border-hairline bg-night-2 px-5 pb-8 pt-5 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(44rem,calc(100vw-4rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-plate sm:border sm:px-8 sm:pb-10 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:slide-in-from-bottom-2"
          >
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="font-display text-[clamp(1.4rem,3vw,1.9rem)] font-bold leading-tight text-gold">
                {game?.name}
              </Dialog.Title>
              <Dialog.Close
                className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-cream hover:text-gold"
                aria-label="Close game"
              >
                <X size={22} aria-hidden />
              </Dialog.Close>
            </div>
            <div className="mt-5">{Board && <Board onClose={() => setOpen(null)} />}</div>
            {game && (
              <p className="mt-8 text-[0.875rem] text-cream-3">
                Want a reminder?{' '}
                <Link href={`/read/${game.chapter}`} className="underline decoration-gold/40 underline-offset-4 hover:text-gold">
                  Read the chapter it comes from
                </Link>
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
