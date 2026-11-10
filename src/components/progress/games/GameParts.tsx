import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const goldButton =
  'inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-pill bg-gold px-6 font-bold text-night hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-45';
export const quietButton =
  'inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-pill border border-hairline px-5 font-bold text-cream hover:border-gold/60 hover:text-gold';
export const choiceButton =
  'flex min-h-[3rem] items-center gap-3 rounded-choice border border-hairline px-4 py-2.5 text-left text-cream hover:bg-white/[0.03] aria-pressed:border-gold aria-pressed:bg-gold/[0.09] aria-pressed:text-gold disabled:cursor-default';

/** "3 of 8" with a thin gold bar. */
export function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3 text-[0.875rem] text-cream-3">
      <div
        className="h-[3px] w-28 overflow-hidden rounded-full bg-hairline"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${done / total})` }} />
      </div>
      <span>
        {done} of {total}
      </span>
    </div>
  );
}

/** Right / not quite, said in words and an icon, never by colour alone. */
export function Verdict({ right, children }: { right: boolean; children: ReactNode }) {
  return (
    <p className={cn('flex items-start gap-2', right ? 'text-gold' : 'text-cream')} role="status">
      {right ? <Check size={20} aria-hidden className="mt-0.5 shrink-0" /> : <X size={20} aria-hidden className="mt-0.5 shrink-0" />}
      <span>
        <strong>{right ? 'Right. ' : 'Not quite. '}</strong>
        {children}
      </span>
    </p>
  );
}

export function Finished({
  score,
  total,
  coins,
  message,
  onAgain,
  onClose,
}: {
  score: number;
  total: number;
  coins: number;
  message: string;
  onAgain: () => void;
  onClose: () => void;
}) {
  return (
    <div className="py-4 text-center" role="status">
      <p className="font-display text-[2.5rem] font-bold leading-none text-gold">
        {score} <span className="text-[1.25rem] text-cream-3">of {total}</span>
      </p>
      <p className="mx-auto mt-4 max-w-measure text-[1.0625rem] text-cream">{message}</p>
      <p className="mt-2 text-[0.9375rem] text-cream-3">
        {coins > 0 ? `You earned ${coins} coins.` : 'Coins for this game come once a day. Play again tomorrow to earn more.'}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <button type="button" className={goldButton} onClick={onAgain}>
          Play again
        </button>
        <button type="button" className={quietButton} onClick={onClose}>
          Back to your progress
        </button>
      </div>
    </div>
  );
}

export function cheer(score: number, total: number) {
  const pct = score / total;
  if (pct === 1) return 'Every one right. That is how a plan works.';
  if (pct >= 0.75) return 'Nearly all of them. Look again at the ones you missed.';
  if (pct >= 0.5) return 'A good start. Try once more and see what changes.';
  return 'Money choices take practice. Read the chapter again, then try once more.';
}
