import { beforeEach, describe, expect, it } from 'vitest';
import {
  PARTY_BUDGET,
  PARTY_ITEMS,
  SAVINGS_QUESTIONS,
  bestPartyHelp,
  bestScores,
  partyScore,
  periodsToSave,
  pickMatchTerms,
  recordGame,
  resetGamesCache,
} from './games';
import { getCoins, resetRewardsCache } from './rewards';

beforeEach(() => {
  localStorage.clear();
  resetRewardsCache();
  resetGamesCache();
});

describe('how long to save', () => {
  it('rounds up to whole periods', () => {
    expect(periodsToSave({ goal: 'x', cost: 140, perPeriod: 10, period: 'week' })).toBe(14);
    expect(periodsToSave({ goal: 'x', cost: 10, perPeriod: 3, period: 'day' })).toBe(4);
    for (const q of SAVINGS_QUESTIONS) expect(periodsToSave(q)).toBeGreaterThan(0);
  });
});

describe('class party', () => {
  it('finds the best plan within budget by brute force', () => {
    let best = 0;
    for (let mask = 0; mask < 1 << PARTY_ITEMS.length; mask++) {
      const picked = PARTY_ITEMS.filter((_, i) => mask & (1 << i));
      if (picked.reduce((s, i) => s + i.price, 0) <= PARTY_BUDGET) best = Math.max(best, picked.reduce((s, i) => s + i.helps, 0));
    }
    expect(bestPartyHelp()).toBe(best);
  });

  it('scores 10 for a best plan, 0 for an empty or over-budget one', () => {
    expect(partyScore([])).toBe(0);
    expect(partyScore(PARTY_ITEMS.map((i) => i.name))).toBe(0);
    expect(partyScore(['Sandwich tray', 'Bowl of fruit', 'Bottled water', 'Speaker for music', 'Paper decorations'])).toBe(10);
  });
});

describe('money words', () => {
  it('picks distinct terms', () => {
    const terms = pickMatchTerms(5);
    expect(new Set(terms.map((t) => t.id)).size).toBe(5);
  });
});

describe('scores', () => {
  it('keeps the best score and pays coins once a day per game', () => {
    const day = new Date('2026-11-09T12:00:00Z');
    expect(recordGame('every-dollar', 6, 8, day)).toBe(20); // 75%
    expect(recordGame('every-dollar', 8, 8, day)).toBe(0);
    expect(bestScores()['every-dollar']).toBe(100);
    expect(getCoins().totalCoins).toBe(20);
    expect(recordGame('every-dollar', 8, 8, new Date('2026-11-10T12:00:00Z'))).toBe(30);
  });
});
