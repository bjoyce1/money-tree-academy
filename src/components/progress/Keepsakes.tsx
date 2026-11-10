import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Check } from 'lucide-react';
import { CHAPTERS } from '@/data/content';
import { KEEPSAKES, buyKeepsake, refundRetiredItems, useOwnedKeepsakes } from '@/lib/collection';
import { useRewards } from '@/lib/rewards';
import { cn } from '@/lib/utils';

/** Spend coins on keepsakes from the story; owned ones sit on your shelf. */
export function Keepsakes() {
  const owned = useOwnedKeepsakes();
  const { coins } = useRewards();
  const [message, setMessage] = useState('');

  // One-time clean-up of the old shop's items, which never did anything.
  useEffect(() => {
    const refund = refundRetiredItems();
    if (refund > 0) setMessage(`The old shop's themes and effects are gone. We gave back ${refund} coins.`);
  }, []);

  const buy = (id: string, name: string) => {
    const r = buyKeepsake(id);
    if (r === 'bought') setMessage(`${name} is on your shelf.`);
    if (r === 'short') setMessage(`You need more coins for ${name}. Finish a chapter or play a game to earn some.`);
  };

  return (
    <div>
      <p className="max-w-measure text-cream-2">
        Things from the story, bought with the coins you earn by reading. You have{' '}
        <strong className="text-gold [font-variant-numeric:tabular-nums]">{coins.totalCoins}</strong> coins and{' '}
        {owned.length} of {KEEPSAKES.length} keepsakes.
      </p>
      <p className="mt-2 min-h-[1.5rem] text-[0.9375rem] text-cream" role="status">
        {message}
      </p>
      <ul className="mt-4 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {KEEPSAKES.map((k) => {
          const have = owned.includes(k.id);
          const chapter = CHAPTERS.find((c) => c.id === k.chapterId);
          const short = !have && coins.totalCoins < k.price;
          return (
            <li key={k.id} className="flex flex-col border-t border-hairline py-5" data-testid={`keepsake-${k.id}`}>
              <p className={cn('font-display text-[1.15rem] font-semibold leading-snug', have ? 'text-gold' : 'text-cream')}>{k.name}</p>
              <p className="mt-1.5 flex-1 text-[0.9375rem] leading-[1.55] text-cream-2">{k.story}</p>
              {chapter && (
                <Link
                  href={`/read/${chapter.slug}`}
                  className="mt-2 self-start text-[0.875rem] text-cream-3 underline decoration-gold/30 underline-offset-4 hover:text-gold"
                >
                  {chapter.title}
                </Link>
              )}
              <div className="mt-4">
                {have ? (
                  <span className="inline-flex min-h-[2.75rem] items-center gap-2 font-bold text-gold">
                    <Check size={18} aria-hidden /> On your shelf
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => buy(k.id, k.name)}
                    aria-disabled={short}
                    className={cn(
                      'inline-flex min-h-[2.75rem] items-center rounded-pill border px-4 font-bold',
                      short ? 'border-dashed border-hairline text-cream-3' : 'border-gold/50 text-cream hover:border-gold hover:text-gold',
                    )}
                    data-testid={`buy-${k.id}`}
                  >
                    Buy for {k.price} coins
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
