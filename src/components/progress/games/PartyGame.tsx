import { useState } from 'react';
import { Check } from 'lucide-react';
import { PARTY_BUDGET, PARTY_ITEMS, bestPartyHelp, partyScore, recordGame } from '@/lib/games';
import { Finished, cheer, goldButton } from './GameParts';

/** Plan the class party: choose what helps the most classmates for $50. */
export function PartyGame({ onClose }: { onClose: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [result, setResult] = useState<{ score: number; coins: number } | null>(null);

  const spent = PARTY_ITEMS.filter((i) => chosen.includes(i.name)).reduce((s, i) => s + i.price, 0);
  const helped = PARTY_ITEMS.filter((i) => chosen.includes(i.name)).reduce((s, i) => s + i.helps, 0);
  const left = PARTY_BUDGET - spent;

  if (result) {
    return (
      <Finished
        score={result.score}
        total={10}
        coins={result.coins}
        message={`Your plan helps ${helped} classmates. The best plan for $${PARTY_BUDGET} helps ${bestPartyHelp()}. ${cheer(result.score, 10)}`}
        onAgain={() => {
          setChosen([]);
          setResult(null);
        }}
        onClose={onClose}
      />
    );
  }

  // Check the budget against the latest choices, not this render's, so quick taps can't overspend.
  const toggle = (name: string, price: number) =>
    setChosen((c) => {
      if (c.includes(name)) return c.filter((n) => n !== name);
      const spentNow = PARTY_ITEMS.filter((i) => c.includes(i.name)).reduce((s, i) => s + i.price, 0);
      return spentNow + price <= PARTY_BUDGET ? [...c, name] : c;
    });

  return (
    <div>
      <p className="text-[1.0625rem] text-cream-2">
        The class has <strong className="text-cream">${PARTY_BUDGET}</strong>. Pick what helps the most classmates enjoy the party.
      </p>
      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem] text-cream-3" aria-live="polite">
        <span>
          Left to spend: <strong className="text-gold [font-variant-numeric:tabular-nums]">${left}</strong>
        </span>
        <span>
          Classmates helped: <strong className="text-cream [font-variant-numeric:tabular-nums]">{helped}</strong>
        </span>
      </p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {PARTY_ITEMS.map((item) => {
          const on = chosen.includes(item.name);
          const tooMuch = !on && item.price > left;
          return (
            <li key={item.name}>
              <button
                type="button"
                aria-pressed={on}
                disabled={tooMuch}
                onClick={() => toggle(item.name, item.price)}
                className="flex min-h-[3.5rem] w-full items-center gap-3 rounded-choice border border-hairline px-4 py-2.5 text-left text-cream hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:border-dashed aria-pressed:border-gold aria-pressed:bg-gold/[0.09]"
              >
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-current text-gold"
                >
                  {on && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{item.name}</span>
                  <span className="block text-[0.875rem] text-cream-3">
                    Helps {item.helps} classmates{tooMuch ? ' · not enough left' : ''}
                  </span>
                </span>
                <span className="font-bold [font-variant-numeric:tabular-nums]">${item.price}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={`${goldButton} mt-6`}
        disabled={chosen.length === 0}
        onClick={() => {
          const score = partyScore(chosen);
          setResult({ score, coins: recordGame('class-party', score, 10) });
        }}
      >
        This is our plan
      </button>
    </div>
  );
}
