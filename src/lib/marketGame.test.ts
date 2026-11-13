import { describe, expect, it } from 'vitest';
import {
  BOY_COINS,
  CHANGE_OWED,
  CROWDS,
  DAYS,
  PACK_COST,
  START_CASH,
  UPGRADES,
  answerEvent,
  formatMoney,
  isOver,
  maxPacks,
  newMarket,
  openStand,
  peopleToday,
  planCost,
  score,
  totals,
  type MarketGame,
  type UpgradeId,
} from './marketGame';

/** Play a whole game with one plan per day and fixed answers to the two moments. */
function play(seed: number, plan: (g: MarketGame) => { price: number; make: number; buy?: UpgradeId[] }, answers = { boy: true, change: true }) {
  let g = newMarket(seed);
  while (!isOver(g)) {
    if (g.event) {
      g = answerEvent(g, g.event === 'boy' ? answers.boy : answers.change);
      continue;
    }
    const c = plan(g);
    g = openStand(g, { ...c, make: Math.min(c.make, maxPacks(g, c.buy)) });
  }
  return g;
}

describe('a new market', () => {
  it('is the same for the same seed and never opens on the busiest day', () => {
    expect(newMarket(4).crowds).toEqual(newMarket(4).crowds);
    for (let seed = 1; seed <= 100; seed++) {
      const g = newMarket(seed);
      expect(g.crowds).toHaveLength(DAYS);
      expect(g.crowds[0]).not.toBe('busy');
      expect(g.crowds.filter((c) => c === 'busy')).toHaveLength(2);
      expect(g.cash).toBe(START_CASH);
    }
  });
});

describe('a day at the stand', () => {
  it('counts revenue, cost and profit the way the book does', () => {
    const g = openStand(newMarket(7), { price: 200, make: 8 });
    const r = g.history[0];
    expect(r.revenue).toBe(r.sold * 200);
    expect(r.packCost).toBe(8 * PACK_COST);
    expect(r.profit).toBe(r.revenue - r.packCost);
    expect(g.cash).toBe(START_CASH + r.profit);
    expect(r.sold + r.leftover).toBe(8);
    expect(r.sold + r.pricey + r.soldOut).toBe(r.visits.length);
    expect(r.visits.length).toBe(CROWDS[g.crowds[0]].people);
  });

  it('sells to fewer people as the price goes up', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const days = [100, 200, 300, 400].map((price) => openStand(newMarket(seed), { price, make: 10 }).history[0]);
      // Selling out would hide it, so compare everyone who was willing to buy.
      const willing = days.map((r) => r.sold + r.soldOut);
      expect(willing[0]).toBeGreaterThanOrEqual(willing[1]);
      expect(willing[1]).toBeGreaterThan(willing[2]);
      expect(willing[2]).toBeGreaterThan(willing[3]);
      // At $1 a pack sells for what it costs: busy, and nothing left over.
      expect(days[0].profit).toBeLessThanOrEqual(0);
    }
  });

  it('turns people away when the packs run out, and has packs left when too many were made', () => {
    const few = openStand(newMarket(3), { price: 100, make: 2 }).history[0];
    expect(few.sold).toBe(2);
    expect(few.soldOut).toBeGreaterThan(0);
    expect(few.leftover).toBe(0);
    const many = openStand(newMarket(3), { price: 400, make: 10 }).history[0];
    expect(many.leftover).toBeGreaterThan(0);
    expect(many.profit).toBeLessThan(0);
  });

  it('will not spend money the business does not have', () => {
    const g = newMarket(3);
    expect(maxPacks(g)).toBe(10);
    expect(maxPacks(g, ['sign'])).toBe(6);
    expect(() => openStand(g, { price: 200, make: 11 })).toThrow();
    expect(() => openStand(g, { price: 200, make: 8, buy: ['sign'] })).toThrow();
    expect(() => openStand(g, { price: 250, make: 2 })).toThrow();
    expect(planCost(g, { price: 200, make: 4, buy: ['sign', 'sample'] })).toBe(400 + UPGRADES.sign.cost + UPGRADES.sample.cost);
  });

  it('brings more people with a sign and more buyers with a sample, bought once', () => {
    const plain = newMarket(9);
    expect(peopleToday(plain, ['sign'])).toBe(peopleToday(plain) + 4);
    const g = openStand(plain, { price: 300, make: 3, buy: ['sign', 'sample'] });
    expect(g.upgrades).toEqual({ sign: true, sample: true });
    expect(g.history[0].upgradeCost).toBe(600);
    // Asking for them again costs nothing more.
    expect(planCost(g, { price: 300, make: 0, buy: ['sign', 'sample'] })).toBe(0);
    const withSample = openStand(newMarket(9), { price: 300, make: 0, buy: ['sample'] }).history[0];
    const without = openStand(newMarket(9), { price: 300, make: 0 }).history[0];
    expect(withSample.soldOut).toBeGreaterThan(without.soldOut);
  });
});

describe('the boy with 75 cents', () => {
  const afterTwoDays = (make: number) => openStand(openStand(newMarket(12), { price: 400, make }), { price: 400, make });

  it('comes by after the second day and waits for an answer', () => {
    const g = afterTwoDays(4);
    expect(g.event).toBe('boy');
    expect(openStand(g, { price: 200, make: 1 })).toBe(g);
  });

  it('gets a leftover pack for his coins and his help', () => {
    const g = afterTwoDays(5);
    expect(g.history[1].leftover).toBeGreaterThan(0);
    const yes = answerEvent(g, true);
    expect(yes.cash).toBe(g.cash + BOY_COINS);
    expect(yes.history[1].leftover).toBe(g.history[1].leftover - 1);
    expect(yes.served).toBe(g.served + 1);
    expect(yes.word).toBe(2);
    expect(yes.event).toBeNull();
  });

  it('gets a fresh pack when none are left, and can be turned away', () => {
    const g = afterTwoDays(0);
    expect(answerEvent(g, true).cash).toBe(g.cash + BOY_COINS - PACK_COST);
    const no = answerEvent(g, false);
    expect(no.cash).toBe(g.cash);
    expect(no.helpedBoy).toBe(false);
    expect(no.word).toBe(0);
  });
});

describe('the change', () => {
  const afterFourDays = () => {
    let g = newMarket(5);
    for (let i = 0; i < 4; i++) {
      g = openStand(g, { price: 200, make: 6 });
      if (g.event === 'boy') g = answerEvent(g, false);
    }
    return g;
  };

  it('costs nothing to give back and brings people the next day', () => {
    const g = afterFourDays();
    expect(g.event).toBe('change');
    const honest = answerEvent(g, true);
    expect(honest.cash).toBe(g.cash);
    expect(peopleToday(honest)).toBe(peopleToday({ ...g, event: null }) + 2);
  });

  it('pays $3 to keep and loses customers and the honest name', () => {
    const g = afterFourDays();
    const kept = answerEvent(g, false);
    expect(kept.cash).toBe(g.cash + CHANGE_OWED);
    expect(peopleToday(kept)).toBe(peopleToday({ ...g, event: null }) - 5);
    const end = openStand(kept, { price: 200, make: 6 });
    expect(isOver(end)).toBe(true);
    expect(score(end).parts.find((p) => p.id === 'name')!.points).toBe(0);
  });
});

describe('the score', () => {
  const share = (price: number, sample: boolean) => (sample ? [1, 0.9, 0.55, 0.25] : [1, 0.8, 0.42, 0.18])[price / 100 - 1];

  it('is 10 for a fair price, the right amount, money put back in, and an honest name', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const g = play(seed, (g) => {
        const buy: UpgradeId[] = g.day >= 1 ? (['sign', 'sample'] as UpgradeId[]).filter((u) => !g.upgrades[u]) : [];
        return { price: 200, make: Math.round(peopleToday(g, buy) * share(200, true)), buy };
      });
      expect(score(g).total).toBe(10);
      expect(totals(g).profit).toBe(g.cash - START_CASH);
      expect(totals(g).revenue - totals(g).costs).toBe(g.cash - START_CASH);
    }
  });

  it('is lower for a price that is too high, for waste, and for keeping the change', () => {
    const greedy = play(2, (g) => ({ price: 400, make: Math.round(peopleToday(g) * 0.18) }));
    expect(score(greedy).total).toBeLessThanOrEqual(7);
    const wasteful = play(2, () => ({ price: 300, make: 20 }));
    expect(score(wasteful).parts.find((p) => p.id === 'waste')!.points).toBe(0);
    expect(score(wasteful).total).toBeLessThanOrEqual(5);
    const honest = play(2, () => ({ price: 200, make: 9 }));
    const kept = play(2, () => ({ price: 200, make: 9 }), { boy: true, change: false });
    expect(score(kept).total).toBeLessThan(score(honest).total);
  });

  it('gives no profit points for selling at cost', () => {
    const g = play(3, (g) => ({ price: 100, make: peopleToday(g) }));
    expect(score(g).parts.find((p) => p.id === 'profit')!.points).toBe(0);
  });

  it('stays between 0 and 10', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const price of [100, 200, 300, 400]) {
        const g = play(seed, () => ({ price, make: 24 }), { boy: seed % 2 === 0, change: seed % 3 === 0 });
        // Every cent is accounted for, whatever was chosen along the way.
        expect(totals(g).profit).toBe(g.cash - START_CASH);
        const s = score(g);
        expect(s.total).toBeGreaterThanOrEqual(0);
        expect(s.total).toBeLessThanOrEqual(10);
        expect(s.parts.reduce((sum, p) => sum + p.max, 0)).toBe(10);
      }
    }
  });
});

describe('money', () => {
  it('shows cents only when there are some', () => {
    expect(formatMoney(75)).toBe('$0.75');
    expect(formatMoney(1200)).toBe('$12');
    expect(formatMoney(-250)).toBe('−$2.50');
  });
});
