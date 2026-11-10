import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChapterQuiz, isCorrect } from './ChapterQuiz';
import { getQuiz } from '@/data/content';
import { getQuizResult } from '@/lib/rewards';

describe('isCorrect', () => {
  const q = { id: 'q', type: 'multi' as const, prompt: '', choices: ['a', 'b', 'c'], answerKey: [2, 0] };
  it('ignores order and needs every key', () => {
    expect(isCorrect(q, [0, 2])).toBe(true);
    expect(isCorrect(q, [0])).toBe(false);
    expect(isCorrect(q, [0, 1, 2])).toBe(false);
  });
});

describe('ChapterQuiz', () => {
  it('waits for every answer, then scores and saves the attempt', async () => {
    const user = userEvent.setup();
    const quiz = getQuiz('qz-01')!;
    render(<ChapterQuiz quizId="qz-01" />);

    const check = screen.getByRole('button', { name: 'Check my answers' });
    expect(check).toBeDisabled();

    for (const q of quiz.questions) {
      for (const i of q.answerKey) await user.click(screen.getByTestId(`choice-${q.id}-${i}`));
    }
    expect(check).toBeEnabled();
    await user.click(check);

    expect(screen.getByTestId('quiz-score')).toHaveTextContent(`All ${quiz.questions.length} right`);
    expect(getQuizResult('qz-01')?.score).toBe(quiz.questions.length);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
