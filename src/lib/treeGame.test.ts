import { describe, expect, it } from 'vitest';
import {
  BORROW_COST,
  COIN,
  GOALS,
  SEASONS,
  coinsToPlace,
  formatMoney,
  goldShare,
  isOver,
  newGame,
  playSeason,
  score,
  treeSize,
  treeStage,
  type Split,
  type TreeGame,
} from './treeGame';

const all = (jar: 'spend' | 'save' | 'grow', coins: number): Split => ({ spend: 0, save: 0, grow: 0, [jar]: coins });

function playAll(g: TreeGame, choose: (g: TreeGame, coins: number) => Split) {
  while (!isOver(g)) g = playSeason(g, choose(g, coinsToPlace(g)));
  return g;
}

describe('a new game', () => {
  it('is the same game for the same seed', () => {
    expect(newGame('tablet', 7).plan).toEqual(newGame('tablet', 7).plan);
    expect(newGame('tablet', 7).plan).not.toEqual(newGame('tablet', 8).plan);
  });

  it('pays $240 over eight seasons, with two surprises and no storm first', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { plan } = newGame('shoes', seed);
      expect(plan).toHaveLength(SEASONS);
      expect(plan.reduce((s, p) => s + p.income, 0)).toBe(24000);
      const surprises = plan.map((p, i) => (p.surprise ? i : -1)).filter((i) => i >= 0);
      expect(surprises).toHaveLength(2);
      expect(surprises[0]).toBeGreaterThanOrEqual(1);
      expect(surprises[1]).toBeLessThanOrEqual(6);
      expect(plan[0].weather.percent).toBeGreaterThan(-10);
      expect(plan.filter((p) => p.weather.percent < 0)).toHaveLength(2);
    }
  });
});

describe('a season', () => {
  it('needs every coin to have a job', () => {
    const g = newGame('tablet', 3);
    expect(() => playSeason(g, { spend: 0, save: 1, grow: 0 })).toThrow();
    expect(() => playSeason(g, { spend: -1, save: coinsToPlace(g) + 1, grow: 0 })).toThrow();
  });

  it('grows the Grow money by the season’s weather, growth on growth', () => {
    let g = newGame('tablet', 11);
    let expected = 0;
    for (let i = 0; i < SEASONS; i++) {
      const coins = coinsToPlace(g);
      const before = g;
      g = playSeason(g, all('grow', coins));
      const r = g.history[i];
      expected += coins * COIN;
      expect(r.growBefore).toBe(expected);
      expected += Math.round((expected * before.plan[i].weather.percent) / 100);
      // Surprises here come out of the tree, since nothing was saved.
      expected -= r.surprise?.fromGrow ?? 0;
      expect(g.grow).toBe(expected);
    }
    // All in from the start: more comes out than went in, despite two bad seasons.
    expect(g.grow).toBeGreaterThan(g.planted);
    expect(goldShare(g)).toBeGreaterThan(0);
  });

  it('keeps Save safe: it never changes with the weather', () => {
    const g = playAll(newGame('tablet', 5), (_, coins) => all('save', coins));
    const surprises = g.plan.reduce((s, p) => s + (p.surprise?.cost ?? 0), 0);
    expect(g.save).toBe(24000 - surprises);
    expect(g.grow).toBe(0);
    expect(g.surprisesMet).toBe(2);
  });

  it('counts at most two treats a season', () => {
    const g = playSeason(newGame('tablet', 5), all('spend', coinsToPlace(newGame('tablet', 5))));
    expect(g.treats).toBe(2);
    expect(g.history[0].treat).toBeTruthy();
    expect(playSeason(newGame('tablet', 5), all('save', coinsToPlace(newGame('tablet', 5)))).history[0].treat).toBeNull();
  });
});

describe('a surprise', () => {
  const firstSurprise = (g: TreeGame) => g.plan.findIndex((p) => p.surprise);

  it('is paid from Save when Save can cover it', () => {
    let g = newGame('tablet', 21);
    const at = firstSurprise(g);
    while (g.season <= at) g = playSeason(g, all('save', coinsToPlace(g)));
    const s = g.history[at].surprise!;
    expect(s.fromSave).toBe(s.cost);
    expect(s.fromGrow).toBe(0);
    expect(s.borrowed).toBe(0);
    expect(g.surprisesMet).toBe(1);
    expect(g.debt).toBe(0);
  });

  it('comes out of the tree when Save is short', () => {
    let g = newGame('tablet', 21);
    const at = firstSurprise(g);
    while (g.season <= at) g = playSeason(g, all('grow', coinsToPlace(g)));
    const s = g.history[at].surprise!;
    expect(s.fromSave).toBe(0);
    expect(s.fromGrow).toBe(s.cost);
    expect(g.surprisesMet).toBe(0);
    expect(g.planted).toBeLessThan(g.history.reduce((sum, r) => sum + r.placed.grow, 0));
  });

  it('is borrowed when there is nothing left, and borrowing costs extra next season', () => {
    let g = newGame('tablet', 21);
    const at = firstSurprise(g);
    while (g.season <= at) g = playSeason(g, all('spend', coinsToPlace(g)));
    const s = g.history[at].surprise!;
    expect(s.borrowed).toBe(s.cost);
    expect(s.owed).toBe(s.cost + BORROW_COST);
    expect(g.debt).toBe(s.cost + BORROW_COST);
    // Fewer coins to place next season: the debt is paid first.
    expect(coinsToPlace(g)).toBe((g.plan[g.season].income - g.debt) / COIN);
    const next = playSeason(g, all('save', coinsToPlace(g)));
    expect(next.debt).toBe(next.history[at + 1].surprise?.owed ?? 0);
    expect(next.history[at + 1].repaid).toBe(g.debt);
  });
});

describe('the score', () => {
  it('is 10 for a plan that saves first, keeps a cushion, plants early and enjoys a little', () => {
    // Plant early, save the rest, one small treat in each of the last three seasons.
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const g = playAll(newGame('tablet', seed), (g, coins) => {
        const i = g.season;
        const grow = i === 0 ? 4 : i === 1 ? 4 : i === 2 ? 3 : 0;
        const spend = i >= 5 ? 1 : 0;
        return { grow, spend, save: coins - grow - spend };
      });
      expect(score(g).total).toBe(10);
    }
  });

  it('never goes above 10 or below 0', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const jar of ['spend', 'save', 'grow'] as const) {
        const s = score(playAll(newGame('shoes', seed), (_, coins) => all(jar, coins)));
        expect(s.total).toBeGreaterThanOrEqual(0);
        expect(s.total).toBeLessThanOrEqual(10);
        expect(s.parts.reduce((sum, p) => sum + p.max, 0)).toBe(10);
      }
    }
  });

  it('is low for spending everything', () => {
    const g = playAll(newGame('tablet', 9), (_, coins) => all('spend', coins));
    // Only the treats count; the surprises were borrowed.
    expect(score(g).total).toBe(1);
  });

  it('does not reach the goal by saving nothing', () => {
    const g = playAll(newGame('shoes', 9), (_, coins) => all('grow', coins));
    const goal = score(g).parts.find((p) => p.id === 'goal')!;
    expect(goal.points).toBe(0);
    expect(GOALS.shoes.cost).toBe(14000);
  });
});

describe('the tree', () => {
  it('grows with the Grow money and stops at full size', () => {
    expect(treeSize(0)).toBe(0);
    expect(treeSize(1000)).toBeGreaterThan(0);
    expect(treeSize(4000)).toBeGreaterThan(treeSize(1000));
    expect(treeSize(1_000_000)).toBe(1);
    expect(treeStage(0)).toBe('A seed');
    expect(treeStage(1_000_000)).toBe('A golden tree');
  });
});

describe('money', () => {
  it('shows cents only when there are some', () => {
    expect(formatMoney(1200)).toBe('$12');
    expect(formatMoney(1250)).toBe('$12.50');
    expect(formatMoney(-605)).toBe('−$6.05');
    expect(formatMoney(0)).toBe('$0');
  });
});
