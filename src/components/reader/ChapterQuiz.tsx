import { useEffect, useId, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { getQuiz, type QuizQuestion } from '@/data/content';
import { getQuizResult, saveQuizResult } from '@/lib/rewards';
import { cn } from '@/lib/utils';

type Answers = Record<string, number[]>;

export function isCorrect(q: QuizQuestion, picked: number[] = []) {
  const a = [...picked].sort((x, y) => x - y);
  const k = [...q.answerKey].sort((x, y) => x - y);
  return a.length === k.length && a.every((v, i) => v === k[i]);
}

/** The chapter quiz: three questions from the book, checked together. */
export function ChapterQuiz({ quizId }: { quizId: string }) {
  const quiz = getQuiz(quizId);
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    setAnswers({});
    setChecked(false);
    setBest(getQuizResult(quizId)?.score ?? null);
  }, [quizId]);

  if (!quiz) return null;
  const total = quiz.questions.length;
  const answeredAll = quiz.questions.every((q) => (answers[q.id] || []).length > 0);
  const score = quiz.questions.filter((q) => isCorrect(q, answers[q.id])).length;

  const pick = (q: QuizQuestion, i: number) => {
    if (checked) return;
    setAnswers((prev) => {
      const cur = prev[q.id] || [];
      const next = q.type === 'multi' ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : [i];
      return { ...prev, [q.id]: next };
    });
  };

  const check = () => {
    setChecked(true);
    saveQuizResult(quizId, { score, total, answers });
    setBest((b) => Math.max(b ?? 0, score));
  };

  return (
    <section aria-labelledby="quiz-title" className="text-[length:var(--r-size)] leading-[1.6] text-reader-soft" data-testid="quiz-block">
      <h2 id="quiz-title" className="font-display text-[1.5em] font-bold leading-tight text-reader-accent">
        Check what you learned
      </h2>
      {best !== null && !checked && (
        <p className="mt-2 text-[0.875em] text-reader-quiet">
          Your best so far: {best} of {total}
        </p>
      )}

      <ol className="mt-6 space-y-9">
        {quiz.questions.map((q, n) => (
          <li key={q.id}>
            <Question
              q={q}
              number={n + 1}
              picked={answers[q.id] || []}
              checked={checked}
              onPick={(i) => pick(q, i)}
            />
          </li>
        ))}
      </ol>

      <div className="mt-9 flex flex-wrap items-center gap-4" aria-live="polite">
        {!checked ? (
          <>
            <button
              type="button"
              onClick={check}
              disabled={!answeredAll}
              className="inline-flex min-h-[3.25rem] items-center rounded-pill bg-gold px-6 text-[1.0625rem] font-bold text-night hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="button-check-quiz"
            >
              Check my answers
            </button>
            {!answeredAll && <span className="text-[0.875em] text-reader-quiet">Answer every question first.</span>}
          </>
        ) : (
          <>
            <p className="font-bold text-reader-ink" data-testid="quiz-score">
              {score === total ? `All ${total} right. Well done!` : `${score} of ${total} right.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setChecked(false);
              }}
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-pill border border-reader-rule px-4 font-bold text-reader-ink hover:border-reader-accent hover:text-reader-accent"
            >
              <RotateCcw size={16} aria-hidden />
              Try again
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function Question({
  q,
  number,
  picked,
  checked,
  onPick,
}: {
  q: QuizQuestion;
  number: number;
  picked: number[];
  checked: boolean;
  onPick: (i: number) => void;
}) {
  const name = useId();
  const multi = q.type === 'multi';
  const right = isCorrect(q, picked);

  return (
    <fieldset>
      <legend className="font-bold text-reader-ink">
        <span className="mr-2 font-display text-reader-accent">{number}.</span>
        {q.prompt}
        {multi && <span className="ml-2 font-normal text-reader-quiet">(choose all that fit)</span>}
      </legend>
      <div className="mt-3 grid gap-2">
        {q.choices.map((choice, i) => {
          const isPicked = picked.includes(i);
          const isKey = q.answerKey.includes(i);
          const state = !checked ? (isPicked ? 'picked' : 'idle') : isKey ? 'key' : isPicked ? 'wrong' : 'idle';
          return (
            <label
              key={i}
              className={cn(
                'flex min-h-[3rem] cursor-pointer items-center gap-3 rounded-choice border px-4 py-2.5 text-reader-ink',
                state === 'idle' && 'border-reader-rule hover:bg-reader-wash',
                state === 'picked' && 'border-reader-accent bg-reader-wash text-reader-accent',
                state === 'key' && 'border-reader-accent bg-reader-wash',
                state === 'wrong' && 'border-reader-rule opacity-80',
                checked && 'cursor-default',
              )}
              data-testid={`choice-${q.id}-${i}`}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={name}
                checked={isPicked}
                disabled={checked && !isPicked}
                onChange={() => onPick(i)}
                className="h-[1.1rem] w-[1.1rem] shrink-0 accent-[var(--r-accent)]"
              />
              <span className="flex-1">{choice}</span>
              {checked && isKey && (
                <span className="inline-flex items-center gap-1 text-[0.85em] font-bold text-reader-accent">
                  <Check size={16} aria-hidden /> Answer
                </span>
              )}
              {checked && state === 'wrong' && (
                <span className="inline-flex items-center gap-1 text-[0.85em] text-reader-quiet">
                  <X size={16} aria-hidden /> Your pick
                </span>
              )}
            </label>
          );
        })}
      </div>
      {checked && (
        <p className="mt-3 text-[0.95em]">
          <strong className="text-reader-ink">{right ? 'Correct. ' : 'Not quite. '}</strong>
          {q.explanation}
        </p>
      )}
    </fieldset>
  );
}
