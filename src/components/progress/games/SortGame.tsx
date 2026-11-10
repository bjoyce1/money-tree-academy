import { useMemo, useState } from 'react';
import { JOBS, SORT_ITEMS, recordGame, shuffle, type Job } from '@/lib/games';
import { Finished, Progress, Verdict, cheer, choiceButton, goldButton } from './GameParts';

/** Give every dollar a job: one choice at a time, four labelled buttons. */
export function SortGame({ onClose }: { onClose: () => void }) {
  const [round, setRound] = useState(0);
  const items = useMemo(() => shuffle(SORT_ITEMS), [round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Job | null>(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState<number | null>(null);

  const item = items[index];
  const total = items.length;

  if (coins !== null) {
    return (
      <Finished
        score={score}
        total={total}
        coins={coins}
        message={cheer(score, total)}
        onAgain={() => {
          setRound((r) => r + 1);
          setIndex(0);
          setPicked(null);
          setScore(0);
          setCoins(null);
        }}
        onClose={onClose}
      />
    );
  }

  const choose = (job: Job) => {
    if (picked) return;
    setPicked(job);
    if (job === item.job) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      setCoins(recordGame('every-dollar', score, total));
    }
  };

  const label = JOBS.find((j) => j.id === item.job)!.label.toLowerCase();

  return (
    <div>
      <Progress done={index} total={total} label="Choices sorted" />
      <p className="mt-6 text-[0.9375rem] text-cream-3">What job does this money have?</p>
      <p className="mt-1 text-pretty text-[clamp(1.3rem,2.8vw,1.6rem)] font-bold leading-snug text-cream">
        {item.name} <span className="text-cream-3">· ${item.amount}</span>
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="Jobs">
        {JOBS.map((j) => (
          <button
            key={j.id}
            type="button"
            aria-pressed={picked === j.id}
            disabled={!!picked}
            onClick={() => choose(j.id)}
            className={choiceButton}
            data-testid={`job-${j.id}`}
          >
            <span>
              <span className="block font-bold">{j.label}</span>
              <span className="block text-[0.875rem] text-cream-3">{j.hint}</span>
            </span>
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-6 space-y-5">
          <Verdict right={picked === item.job}>This one is a {label}.</Verdict>
          <button type="button" className={goldButton} onClick={next} autoFocus>
            {index + 1 < total ? 'Next' : 'See my score'}
          </button>
        </div>
      )}
    </div>
  );
}
