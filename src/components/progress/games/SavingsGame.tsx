import { useState } from 'react';
import { SAVINGS_QUESTIONS, periodsToSave, recordGame } from '@/lib/games';
import { Finished, Progress, Verdict, cheer, goldButton } from './GameParts';

/** How long to save: divide the cost by what you put away each time. */
export function SavingsGame({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState<number | null>(null);
  const total = SAVINGS_QUESTIONS.length;

  if (coins !== null) {
    return (
      <Finished
        score={score}
        total={total}
        coins={coins}
        message={cheer(score, total)}
        onAgain={() => {
          setIndex(0);
          setAnswer('');
          setChecked(false);
          setScore(0);
          setCoins(null);
        }}
        onClose={onClose}
      />
    );
  }

  const q = SAVINGS_QUESTIONS[index];
  const right = periodsToSave(q);
  const isRight = Number(answer) === right;
  const unit = `${q.period}s`;

  const check = () => {
    setChecked(true);
    if (isRight) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setAnswer('');
      setChecked(false);
    } else {
      // The last answer is already counted in score.
      setCoins(recordGame('how-long', score, total));
    }
  };

  return (
    <div>
      <Progress done={index} total={total} label="Goals answered" />
      <p className="mt-6 text-pretty text-[clamp(1.3rem,2.8vw,1.6rem)] font-bold leading-snug text-cream">{q.goal}</p>
      <p className="mt-2 text-[1.0625rem] text-cream-2">
        It costs <strong className="text-cream">${q.cost}</strong>. You save <strong className="text-cream">${q.perPeriod}</strong>{' '}
        every {q.period}.
      </p>
      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checked && answer) check();
          else if (checked) next();
        }}
      >
        <label className="grid gap-1.5">
          <span className="text-[0.9375rem] text-cream-2">How many {unit} until you can buy it?</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={checked}
            className="h-12 w-36 rounded-choice border border-[rgba(230,185,85,0.28)] bg-night px-4 text-[1.125rem] text-cream focus:border-gold focus:outline-none"
            data-testid="input-savings-answer"
          />
        </label>
        {!checked ? (
          <button type="submit" className={goldButton} disabled={!answer}>
            Check
          </button>
        ) : (
          <button type="submit" className={goldButton} autoFocus>
            {index + 1 < total ? 'Next goal' : 'See my score'}
          </button>
        )}
      </form>
      {checked && (
        <div className="mt-6">
          <Verdict right={isRight}>
            ${q.cost} ÷ ${q.perPeriod} = {(q.cost / q.perPeriod).toFixed(q.cost % q.perPeriod ? 1 : 0)}
            {q.cost % q.perPeriod ? `, so it takes ${right} ${unit}: you can't buy it until you have all of it.` : ` ${unit}.`}
          </Verdict>
        </div>
      )}
    </div>
  );
}
