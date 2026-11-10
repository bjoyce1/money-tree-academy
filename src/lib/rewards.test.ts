import { beforeEach, describe, expect, it } from 'vitest';
import {
  completeChapter,
  currentStreak,
  earnCoins,
  getCoins,
  getCompleted,
  getQuizResult,
  getStats,
  getUnlocked,
  recordActivity,
  recordReadingDay,
  resetRewardsCache,
  saveQuizResult,
  spendCoins,
} from './rewards';

beforeEach(() => {
  localStorage.clear();
  resetRewardsCache();
});

describe('coins', () => {
  it('earns and spends, and refuses to overspend', () => {
    earnCoins(30, 'test', 'bonus');
    expect(getCoins().totalCoins).toBe(30);
    expect(spendCoins(50, 'too much')).toBe(false);
    expect(spendCoins(20, 'ok')).toBe(true);
    const c = getCoins();
    expect(c.totalCoins).toBe(10);
    expect(c.totalEarned).toBe(30);
    expect(c.totalSpent).toBe(20);
    expect(c.transactions.map((t) => t.type)).toEqual(['spent', 'earned']);
  });

  it('keeps coins saved in the old format', () => {
    localStorage.setItem('coins_data', JSON.stringify({ totalCoins: 99 }));
    expect(getCoins().totalCoins).toBe(99);
    expect(getCoins().transactions).toEqual([]);
  });
});

describe('reading streak', () => {
  const day = (d: number) => new Date(2026, 10, d, 12);

  it('counts consecutive days, once per day, and lapses after a gap', () => {
    expect(recordReadingDay(day(1))).toBe(1);
    expect(recordReadingDay(day(1))).toBeNull();
    expect(recordReadingDay(day(2))).toBe(2);
    expect(currentStreak(day(3))).toBe(2);
    expect(currentStreak(day(4))).toBe(0);
    expect(recordReadingDay(day(5))).toBe(1);
  });
});

describe('chapters and achievements', () => {
  it('completes a chapter once, earning coins and the first achievement', () => {
    expect(completeChapter('ch-01', 'Chapter 1')).toBe(true);
    expect(completeChapter('ch-01', 'Chapter 1')).toBe(false);
    expect(getCompleted()).toEqual(['ch-01']);
    expect(getStats().chaptersCompleted).toBe(1);
    expect(getUnlocked()['first-chapter']).toBeDefined();
    expect(getCoins().totalCoins).toBeGreaterThan(20);
  });

  it('unlocks an achievement when its count is reached', () => {
    for (let i = 0; i < 9; i++) recordActivity('glossary-used');
    expect(getUnlocked()['word-collector']).toBeUndefined();
    recordActivity('glossary-used');
    expect(getUnlocked()['word-collector']).toBeDefined();
  });

  it('ignores unknown activity types', () => {
    recordActivity('calculator-used');
    expect(localStorage.getItem('achievement_stats')).toBeNull();
  });
});

describe('quiz results', () => {
  it('rewards the first attempt and a perfect score once, keeping the best score', () => {
    saveQuizResult('qz-01', { score: 1, total: 3, answers: {} });
    const afterFirst = getCoins().totalCoins;
    expect(afterFirst).toBe(15);
    saveQuizResult('qz-01', { score: 3, total: 3, answers: {} });
    expect(getCoins().totalCoins).toBe(afterFirst + 15);
    saveQuizResult('qz-01', { score: 2, total: 3, answers: {} });
    expect(getQuizResult('qz-01')!.score).toBe(3);
    expect(getCoins().totalCoins).toBe(afterFirst + 15);
    expect(getStats().quizzesCompleted).toBe(1);
  });
});
