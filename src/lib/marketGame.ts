// Market Day: the rules of the game, with nothing drawn here so every rule
// can be tested. Money is kept in whole cents.
//
// Five evenings at the Youth Market with the Money Tree Fun Pack stand from
// chapter 2. Each day you choose a price and how many packs to make, then
// people walk by: each one buys if the price is worth it to them and a pack
// is left. Revenue is what enters, cost is what the work requires, profit is
// what remains. Two moments from the book test what your name is worth: the
// boy with 75 cents (chapter 2) and a customer's change (chapter 10's
// "Profit without honesty weakens the roots").

import { rng } from './treeGame';

export const DAYS = 5;
/** What one Fun Pack costs to make: about a dollar, as in the book. */
export const PACK_COST = 100;
export const PRICES = [100, 200, 300, 400] as const;
export const START_CASH = 1000;
/** The most packs two people can make in an afternoon. */
export const MAX_PACKS = 24;

export type Crowd = 'quiet' | 'steady' | 'busy';

export const CROWDS: Record<Crowd, { people: number; name: string; forecast: string }> = {
  quiet: { people: 9, name: 'A quiet market', forecast: 'A drizzly evening. Fewer people are out.' },
  steady: { people: 12, name: 'A steady market', forecast: 'A calm evening at the market.' },
  busy: { people: 16, name: 'A busy market', forecast: 'A warm Saturday. The market is full.' },
};

export type UpgradeId = 'sign' | 'sample';

/** Two ways to put money back into the stand, both from chapter 2. */
export const UPGRADES: Record<UpgradeId, { id: UpgradeId; name: string; detail: string; cost: number }> = {
  sign: { id: 'sign', name: 'A clear sign', detail: '“Keep kids busy while they learn.” More people stop.', cost: 400 },
  sample: { id: 'sample', name: 'An open sample pack', detail: 'People see what is inside, so more of them think it is worth it.', cost: 200 },
};
const SIGN_PEOPLE = 4;

// The share of passers-by who think a pack is worth at least $1, $2, $3, $4.
const WORTH = [1, 0.8, 0.42, 0.18];
const WORTH_WITH_SAMPLE = [1, 0.9, 0.55, 0.25];

export type Outcome = 'buy' | 'pricey' | 'soldout';
/** One passer-by: the most they would pay (in dollars, 1 to 4) and what happened. */
export type Visit = { worth: number; outcome: Outcome };

export type DayChoice = { price: number; make: number; buy?: UpgradeId[] };

export type DayReport = {
  day: number; // 1-based
  crowd: Crowd;
  price: number;
  made: number;
  visits: Visit[];
  sold: number;
  pricey: number; // walked on: the price was more than it was worth to them
  soldOut: number; // wanted one after the last pack was gone
  leftover: number; // unsold packs, given to the family center
  revenue: number;
  packCost: number;
  upgradeCost: number;
  bought: UpgradeId[];
  profit: number; // revenue - packCost - upgradeCost
};

/** A moment that needs an answer before the next day. */
export type MarketEvent = 'boy' | 'change';
export const CHANGE_OWED = 300;
export const BOY_COINS = 75;

export type MarketGame = {
  seed: number;
  crowds: Crowd[];
  day: number; // days finished
  cash: number;
  upgrades: Record<UpgradeId, boolean>;
  /** People added to (or lost from) each later day because of how you treated someone. */
  word: number;
  event: MarketEvent | null;
  helpedBoy: boolean | null;
  honest: boolean | null;
  served: number;
  /** Money in and out between days: the boy's coins, his pack, change that was kept. */
  otherIn: number;
  otherOut: number;
  history: DayReport[];
};

function shuffled<T>(list: readonly T[], rand: () => number) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newMarket(seed = Math.floor(Math.random() * 2 ** 31)): MarketGame {
  const rand = rng(seed);
  // The first day is never the busiest: there is only $10 to start with.
  let crowds = shuffled<Crowd>(['quiet', 'steady', 'steady', 'busy', 'busy'], rand);
  if (crowds[0] === 'busy') {
    const swap = crowds.findIndex((c) => c !== 'busy');
    [crowds[0], crowds[swap]] = [crowds[swap], crowds[0]];
  }
  return {
    seed,
    crowds,
    day: 0,
    cash: START_CASH,
    upgrades: { sign: false, sample: false },
    word: 0,
    event: null,
    helpedBoy: null,
    honest: null,
    served: 0,
    otherIn: 0,
    otherOut: 0,
    history: [],
  };
}

export const isOver = (g: MarketGame) => g.day >= DAYS && !g.event;

/** How many people will pass the stand today. */
export function peopleToday(g: MarketGame, buying: UpgradeId[] = []) {
  if (g.day >= DAYS) return 0;
  const sign = g.upgrades.sign || buying.includes('sign');
  return Math.max(4, CROWDS[g.crowds[g.day]].people + (sign ? SIGN_PEOPLE : 0) + g.word);
}

/** What today's plan costs before a single pack is sold. */
export function planCost(g: MarketGame, c: DayChoice) {
  const upgrades = (c.buy ?? []).filter((u) => !g.upgrades[u]).reduce((s, u) => s + UPGRADES[u].cost, 0);
  return c.make * PACK_COST + upgrades;
}

/** The most packs today's money can make, after any upgrades chosen. */
export function maxPacks(g: MarketGame, buy: UpgradeId[] = []) {
  const left = g.cash - planCost(g, { price: PRICES[0], make: 0, buy });
  return Math.max(0, Math.min(MAX_PACKS, Math.floor(left / PACK_COST)));
}

/** Open the stand for a day. Returns the next state, with the day's report added. */
export function openStand(g: MarketGame, c: DayChoice): MarketGame {
  if (g.day >= DAYS || g.event) return g;
  const buy = (c.buy ?? []).filter((u, i, a) => !g.upgrades[u] && a.indexOf(u) === i);
  if (!PRICES.includes(c.price as (typeof PRICES)[number])) throw new Error('Pick a price');
  if (!Number.isInteger(c.make) || c.make < 0 || c.make > MAX_PACKS) throw new Error('Pick how many packs to make');
  const cost = planCost(g, { ...c, buy });
  if (cost > g.cash) throw new Error('Not enough money for that plan');

  const upgrades = { ...g.upgrades };
  for (const u of buy) upgrades[u] = true;
  const people = peopleToday(g, buy);
  const worth = upgrades.sample ? WORTH_WITH_SAMPLE : WORTH;

  // Spread the crowd evenly across what a pack is worth to them, so one lucky
  // or unlucky day cannot hide what the price did. Then mix up the order.
  const rand = rng(g.seed + 977 * (g.day + 1));
  const line = shuffled(
    Array.from({ length: people }, (_, i) => {
      const u = (i + rand()) / people;
      return u < worth[3] ? 4 : u < worth[2] ? 3 : u < worth[1] ? 2 : 1;
    }),
    rand,
  );

  let stock = c.make;
  const visits: Visit[] = line.map((w) => {
    if (c.price > w * 100) return { worth: w, outcome: 'pricey' as const };
    if (stock <= 0) return { worth: w, outcome: 'soldout' as const };
    stock -= 1;
    return { worth: w, outcome: 'buy' as const };
  });

  const sold = c.make - stock;
  const revenue = sold * c.price;
  const packCost = c.make * PACK_COST;
  const upgradeCost = buy.reduce((s, u) => s + UPGRADES[u].cost, 0);
  const report: DayReport = {
    day: g.day + 1,
    crowd: g.crowds[g.day],
    price: c.price,
    made: c.make,
    visits,
    sold,
    pricey: visits.filter((v) => v.outcome === 'pricey').length,
    soldOut: visits.filter((v) => v.outcome === 'soldout').length,
    leftover: stock,
    revenue,
    packCost,
    upgradeCost,
    bought: buy,
    profit: revenue - packCost - upgradeCost,
  };

  const day = g.day + 1;
  return {
    ...g,
    day,
    cash: g.cash - cost + revenue,
    upgrades,
    served: g.served + sold,
    // The boy comes by after the second day; the change turns up after the fourth.
    event: day === 2 ? 'boy' : day === 4 ? 'change' : null,
    history: [...g.history, report],
  };
}

/**
 * Answer the moment that is waiting.
 * boy: yes = take his 75 cents and his help cleaning up, for a pack.
 * change: yes = take the customer the $3 she left behind.
 */
export function answerEvent(g: MarketGame, yes: boolean): MarketGame {
  if (!g.event) return g;
  if (g.event === 'boy') {
    if (!yes) return { ...g, event: null, helpedBoy: false };
    const last = g.history[g.history.length - 1];
    // He gets a leftover pack if there is one; otherwise you make one more.
    const spare = last.leftover > 0;
    const history = spare ? [...g.history.slice(0, -1), { ...last, leftover: last.leftover - 1 }] : g.history;
    return {
      ...g,
      event: null,
      helpedBoy: true,
      cash: g.cash + BOY_COINS - (spare ? 0 : PACK_COST),
      otherIn: g.otherIn + BOY_COINS,
      otherOut: g.otherOut + (spare ? 0 : PACK_COST),
      served: g.served + 1,
      word: g.word + 2,
      history,
    };
  }
  // The change was never yours, so giving it back costs nothing. Keeping it
  // adds $3 today and costs customers tomorrow.
  return yes
    ? { ...g, event: null, honest: true, word: g.word + 2 }
    : { ...g, event: null, honest: false, cash: g.cash + CHANGE_OWED, otherIn: g.otherIn + CHANGE_OWED, word: g.word - 5 };
}

// ------------------------------------------------------------------- score

export const PROFIT_TARGET = 6000;
export const SERVED_TARGET = 40;
export const WASTE_LIMIT = 6;

export type Totals = { revenue: number; costs: number; profit: number; served: number; leftover: number };

export function totals(g: MarketGame): Totals {
  const revenue = g.history.reduce((s, r) => s + r.revenue, 0) + g.otherIn;
  const costs = g.history.reduce((s, r) => s + r.packCost + r.upgradeCost, 0) + g.otherOut;
  return {
    revenue,
    costs,
    // Everything that ended up in the business beyond the $10 it started with.
    profit: revenue - costs,
    served: g.served,
    leftover: g.history.reduce((s, r) => s + r.leftover, 0),
  };
}

export type ScorePart = { id: 'profit' | 'served' | 'name' | 'waste'; label: string; detail: string; points: number; max: number };

/** Ten points across the four things a good business does. */
export function score(g: MarketGame): { parts: ScorePart[]; total: number; max: number } {
  const t = totals(g);
  const parts: ScorePart[] = [
    {
      id: 'profit',
      label: 'Profit',
      detail:
        t.profit > 0
          ? `${formatMoney(t.profit)} left after every cost was paid.`
          : 'The costs were more than the sales. Nothing was left over.',
      points: Math.max(0, Math.min(5, Math.floor((5 * t.profit) / PROFIT_TARGET))),
      max: 5,
    },
    {
      id: 'served',
      label: 'Customers served',
      detail: `${t.served} ${t.served === 1 ? 'pack' : 'packs'} went home with someone. A business creates value for a customer.`,
      points: t.served >= SERVED_TARGET ? 2 : t.served >= SERVED_TARGET * 0.6 ? 1 : 0,
      max: 2,
    },
    {
      id: 'name',
      label: 'An honest name',
      detail:
        g.honest === true
          ? 'You took the change back. Your name is part of everything you sell.'
          : g.honest === false
            ? 'You kept change that was not yours, and people noticed.'
            : 'The moment to prove it did not come up.',
      points: g.honest === true ? 2 : 0,
      max: 2,
    },
    {
      id: 'waste',
      label: 'Made about the right amount',
      detail:
        t.leftover === 0
          ? 'No packs were left over.'
          : `${t.leftover} ${t.leftover === 1 ? 'pack was' : 'packs were'} left over and given to the family center.`,
      points: t.leftover <= WASTE_LIMIT ? 1 : 0,
      max: 1,
    },
  ];
  return { parts, total: parts.reduce((s, p) => s + p.points, 0), max: 10 };
}

/** $12, $12.50, $0.75. Cents only when there are some. */
export function formatMoney(cents: number) {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const part = abs % 100;
  return `${sign}$${whole}${part ? `.${String(part).padStart(2, '0')}` : ''}`;
}
