import { useMemo, useState } from 'react';
import { pickMatchTerms, recordGame, shuffle } from '@/lib/games';
import { cn } from '@/lib/utils';
import { Finished, Progress, cheer } from './GameParts';

/** Tap a money word, then tap what it means. Wrong pairs are shown, then let go. */
export function MatchGame({ onClose }: { onClose: () => void }) {
  const [round, setRound] = useState(0);
  const terms = useMemo(() => pickMatchTerms(5), [round]);
  const meanings = useMemo(() => shuffle(terms), [terms]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [coins, setCoins] = useState<number | null>(null);
  const total = terms.length;
  const score = Math.max(0, total - mistakes);

  if (coins !== null) {
    return (
      <Finished
        score={score}
        total={total}
        coins={coins}
        message={mistakes === 0 ? cheer(total, total) : `All matched, with ${mistakes} wrong ${mistakes === 1 ? 'try' : 'tries'} on the way.`}
        onAgain={() => {
          setRound((r) => r + 1);
          setSelected(null);
          setMatched([]);
          setMistakes(0);
          setCoins(null);
        }}
        onClose={onClose}
      />
    );
  }

  const pickMeaning = (id: string) => {
    if (!selected || matched.includes(id)) return;
    if (id === selected) {
      const next = [...matched, id];
      setMatched(next);
      setSelected(null);
      setMiss(null);
      if (next.length === total) setCoins(recordGame('money-words', Math.max(0, total - mistakes), total));
    } else {
      setMistakes((m) => m + 1);
      setMiss(id);
    }
  };

  const word = terms.find((t) => t.id === selected);

  return (
    <div>
      <Progress done={matched.length} total={total} label="Words matched" />
      <p className="mt-5 text-cream-2" aria-live="polite">
        {word ? (
          <>
            Now choose what <strong className="text-gold">{word.term}</strong> means.
          </>
        ) : (
          'Choose a word first.'
        )}
        {miss && <span className="ml-1 text-cream-3">That meaning belongs to another word.</span>}
      </p>
      <div className="mt-5 grid gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
        <div role="group" aria-label="Words" className="flex flex-wrap content-start gap-2 sm:flex-col">
          {terms.map((t) => {
            const done = matched.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={selected === t.id}
                disabled={done}
                onClick={() => {
                  setSelected(t.id);
                  setMiss(null);
                }}
                className={cn(
                  'min-h-[2.75rem] rounded-pill border px-4 text-left font-display font-semibold',
                  done ? 'border-transparent text-cream-3 line-through decoration-gold/60' : 'border-hairline text-cream hover:border-gold/60',
                  'aria-pressed:border-gold aria-pressed:bg-gold/[0.09] aria-pressed:text-gold',
                )}
              >
                {t.term}
              </button>
            );
          })}
        </div>
        <div role="group" aria-label="Meanings" className="grid gap-2">
          {meanings.map((t) => {
            const done = matched.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                disabled={done || !selected}
                onClick={() => pickMeaning(t.id)}
                className={cn(
                  'min-h-[3rem] rounded-choice border px-4 py-2.5 text-left',
                  done ? 'border-gold/40 bg-gold/[0.06] text-cream-2' : 'border-hairline text-cream hover:bg-white/[0.03]',
                  miss === t.id && 'border-dashed',
                  !selected && !done && 'cursor-default',
                )}
              >
                {done && <span className="mr-2 font-display font-semibold text-gold">{t.term}:</span>}
                {t.shortDefinition}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
