// Grow the Tree: the rules of the game, with nothing drawn here so every
// rule can be tested. Money is kept in whole cents.
//
// Eight seasons at the Money Tree. Each season you earn coins and give every
// one a job: Spend (enjoy today), Save (prepare tomorrow) or Grow (build
// forever). Save pays for surprises and for your goal. Grow feeds the tree,
// which gains or loses a little each season. The ideas come from chapter 5
// (Save First, Spend Second) and chapter 9 (Make Your Money Work).

export const COIN = 500; // one coin is $5
export const SEASONS = 8;

export type Jar = 'spend' | 'save' | 'grow';

export const JARS: { id: Jar; name: string; hint: string }[] = [
  { id: 'spend', name: 'Spend', hint: 'Enjoy today' },
  { id: 'save', name: 'Save', hint: 'Prepare tomorrow' },
  { id: 'grow', name: 'Grow', hint: 'Build forever' },
];

export type GoalId = 'tablet' | 'shoes';

/** Renee's and Alex's own goals from the book, at the book's prices. */
export const GOALS: Record<GoalId, { id: GoalId; name: string; short: string; cost: number; owner: 'renee' | 'alex' }> = {
  tablet: { id: 'tablet', name: 'A drawing tablet', short: 'drawing tablet', cost: 12000, owner: 'renee' },
  shoes: { id: 'shoes', name: 'Black-and-gold shoes', short: 'shoes', cost: 14000, owner: 'alex' },
};

/** How the Grow money changes in a season, in percent. Pretend numbers. */
export type Weather = { kind: 'sun' | 'fair' | 'storm'; percent: number };

// One shuffled deck per game: mostly good seasons, one storm and one dip, so
// growth is never promised but patience is rewarded.
const WEATHER_DECK: Weather[] = [
  { kind: 'sun', percent: 14 },
  { kind: 'sun', percent: 12 },
  { kind: 'sun', percent: 12 },
  { kind: 'fair', percent: 8 },
  { kind: 'fair', percent: 8 },
  { kind: 'fair', percent: 6 },
  { kind: 'storm', percent: -6 },
  { kind: 'storm', percent: -15 },
];

/** Ways to earn, from the book: useful work, products and services. */
const JOBS = [
  'You sorted boxes in Mrs. Carter’s garage',
  'You sold custom bookmarks',
  'You sold Money Tree Fun Packs at the Youth Market',
  'You washed a neighbor’s car',
  'You walked a neighbor’s dog',
  'You raked leaves on your street',
  'You helped set up the community sale',
  'You tutored a younger student in math',
];
const INCOME_DECK = [5, 6, 6, 6, 6, 6, 6, 7]; // coins; 48 in all, $240

/** Small wants. Not bad, just small. */
const TREATS = ['a pack of trading cards', 'a sports drink and a snack', 'a new skin in a video game', 'a comic book', 'a slice of pizza with friends', 'stickers for your notebook'];

const SURPRISES: { name: string; cost: number }[] = [
  { name: 'Your bike got a flat tire', cost: 1500 },
  { name: 'You lost a library book', cost: 1000 },
  { name: 'Your headphones broke', cost: 1500 },
  { name: 'The class trip has a fee', cost: 2000 },
  { name: 'Your backpack strap tore', cost: 1000 },
];

export type Surprise = { name: string; cost: number };

export type SeasonPlan = { income: number; job: string; weather: Weather; treat: string; surprise: Surprise | null };

export type Split = Record<Jar, number>; // coins placed in each jar this season

export type SurpriseResult = Surprise & {
  fromSave: number;
  fromGrow: number;
  borrowed: number; // what could not be paid, borrowed for now
  owed: number; // what the loan costs next season: borrowed + the cost of borrowing
};

export type SeasonReport = {
  season: number; // 1-based
  placed: Split; // cents put in each jar
  repaid: number; // debt paid out of this season's income before any coin was placed
  treat: string | null;
  treats: number; // smiles earned this season (0 to 2)
  weather: Weather;
  growBefore: number; // Grow after this season's coins, before the weather
  growChange: number; // cents gained (or lost, negative)
  surprise: SurpriseResult | null;
};

export type TreeGame = {
  seed: number;
  goal: GoalId;
  plan: SeasonPlan[];
  season: number; // 0-based index of the season being played; SEASONS when finished
  save: number;
  grow: number;
  planted: number; // cents put into Grow, less anything taken back out
  spent: number;
  treats: number;
  debt: number; // owed at the start of the next season
  surprisesMet: number; // paid in full from Save
  surprisesTotal: number;
  history: SeasonReport[];
};

// ------------------------------------------------------------------ random

/** Small seeded generator (mulberry32) so a game can be replayed in tests. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: readonly T[], rand: () => number) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// -------------------------------------------------------------------- game

export function newGame(goal: GoalId, seed = Math.floor(Math.random() * 2 ** 31)): TreeGame {
  const rand = rng(seed);
  const weather = shuffled(WEATHER_DECK, rand);
  // The first season is never the big storm: nobody should lose their first seed.
  if (weather[0].percent <= -10) {
    const swap = 1 + Math.floor(rand() * (SEASONS - 1));
    [weather[0], weather[swap]] = [weather[swap], weather[0]];
  }
  const incomes = shuffled(INCOME_DECK, rand);
  const jobs = shuffled(JOBS, rand);
  const treats = shuffled(TREATS, rand);
  const surprises = shuffled(SURPRISES, rand).slice(0, 2);
  // Two surprises: one in seasons 2 to 4, one in seasons 5 to 7.
  const early = 1 + Math.floor(rand() * 3);
  const late = 4 + Math.floor(rand() * 3);

  const plan: SeasonPlan[] = Array.from({ length: SEASONS }, (_, i) => ({
    income: incomes[i] * COIN,
    job: jobs[i % jobs.length],
    weather: weather[i],
    treat: treats[i % treats.length],
    surprise: i === early ? surprises[0] : i === late ? surprises[1] : null,
  }));

  return {
    seed,
    goal,
    plan,
    season: 0,
    save: 0,
    grow: 0,
    planted: 0,
    spent: 0,
    treats: 0,
    debt: 0,
    surprisesMet: 0,
    surprisesTotal: 2,
    history: [],
  };
}

export const isOver = (g: TreeGame) => g.season >= SEASONS;

/** What a loan costs on top of what was borrowed: borrowing is never free. */
export const BORROW_COST = COIN;

/** Coins to place this season, after last season's borrowing is paid back. */
export function coinsToPlace(g: TreeGame) {
  if (isOver(g)) return 0;
  return Math.max(0, Math.floor((g.plan[g.season].income - g.debt) / COIN));
}

const roundUpToCoin = (cents: number) => Math.ceil(cents / COIN) * COIN;

/** Play one season with the coins split between the jars. Returns the next state. */
export function playSeason(g: TreeGame, split: Split): TreeGame {
  if (isOver(g)) return g;
  const coins = coinsToPlace(g);
  const placedCoins = split.spend + split.save + split.grow;
  if (placedCoins !== coins || split.spend < 0 || split.save < 0 || split.grow < 0) {
    throw new Error(`Place all ${coins} coins`);
  }
  const p = g.plan[g.season];
  const placed: Split = { spend: split.spend * COIN, save: split.save * COIN, grow: split.grow * COIN };
  const repaid = Math.min(g.debt, p.income);

  // Spend: up to two treats a season bring a smile; more of the same adds nothing new.
  const treats = Math.min(2, split.spend);

  let save = g.save + placed.save;
  let grow = g.grow + placed.grow;
  let planted = g.planted + placed.grow;

  // The season passes: the Grow money gains or loses.
  const growBefore = grow;
  const growChange = Math.round((grow * p.weather.percent) / 100);
  grow += growChange;

  // A surprise is paid from Save first, then from Grow, then by borrowing.
  let surprise: SurpriseResult | null = null;
  let debt = 0;
  let met = g.surprisesMet;
  if (p.surprise) {
    const fromSave = Math.min(save, p.surprise.cost);
    const fromGrow = Math.min(grow, p.surprise.cost - fromSave);
    const short = p.surprise.cost - fromSave - fromGrow;
    const borrowed = short > 0 ? roundUpToCoin(short) : 0;
    save -= fromSave;
    // Money taken out of the tree comes out of what was planted first.
    grow -= fromGrow;
    planted = Math.max(0, planted - fromGrow);
    // Change from a rounded-up loan goes back into Save.
    save += borrowed - short;
    debt = borrowed > 0 ? borrowed + BORROW_COST : 0;
    if (fromSave === p.surprise.cost) met += 1;
    surprise = { ...p.surprise, fromSave, fromGrow, borrowed, owed: debt };
  }

  const report: SeasonReport = {
    season: g.season + 1,
    placed,
    repaid,
    treat: split.spend > 0 ? p.treat : null,
    treats,
    weather: p.weather,
    growBefore,
    growChange,
    surprise,
  };

  return {
    ...g,
    season: g.season + 1,
    save,
    grow,
    planted,
    spent: g.spent + placed.spend,
    treats: g.treats + treats,
    debt,
    surprisesMet: met,
    history: [...g.history, report],
  };
}

// ------------------------------------------------------------------- score

/** The Grow money a full-grown tree holds. */
export const TREE_TARGET = 6000;
/** The Grow money at which the drawn tree stops getting bigger. */
export const FULL_GROWN = 11000;
/** Smiles that show some of the money was enjoyed along the way. */
export const TREATS_TARGET = 3;

export type ScorePart = { id: 'goal' | 'ready' | 'tree' | 'joy'; label: string; detail: string; points: number; max: number };

/** Ten points across the four things the tree looks for. */
export function score(g: TreeGame): { parts: ScorePart[]; total: number; max: number } {
  const goal = GOALS[g.goal];
  // Debt still owed at the end comes out of savings before the goal is counted.
  const saved = Math.max(0, g.save - g.debt);
  const dollars = (c: number) => formatMoney(c);
  const reached = saved >= goal.cost;

  const parts: ScorePart[] = [
    {
      id: 'goal',
      label: reached ? `You saved enough for the ${goal.short}` : `Saving for the ${goal.short}`,
      detail: reached
        ? `${dollars(saved)} saved. It costs ${dollars(goal.cost)}, so you can buy it without borrowing.`
        : `${dollars(saved)} of ${dollars(goal.cost)} saved. Not there yet.`,
      points: Math.floor((4 * Math.min(saved, goal.cost)) / goal.cost),
      max: 4,
    },
    {
      id: 'ready',
      label: 'Ready for surprises',
      detail:
        g.surprisesMet === g.surprisesTotal
          ? 'Both surprises were paid from your Save jar.'
          : `${g.surprisesMet} of ${g.surprisesTotal} surprises were paid from your Save jar.`,
      points: g.surprisesMet,
      max: 2,
    },
    {
      id: 'tree',
      label: 'A tree that grew',
      detail:
        g.grow <= 0
          ? 'Nothing was planted, so the tree stayed a seed.'
          : `${dollars(g.grow)} in the tree. You planted ${dollars(g.planted)}; ${dollars(Math.max(0, g.grow - g.planted))} is growth.`,
      points: Math.min(3, Math.floor((3 * g.grow) / TREE_TARGET)),
      max: 3,
    },
    {
      id: 'joy',
      label: 'Enjoyed some today',
      detail:
        g.treats >= TREATS_TARGET
          ? 'Wants are not bad. You made room for a few.'
          : 'Wants are not bad. There was room for a few small ones.',
      points: g.treats >= TREATS_TARGET ? 1 : 0,
      max: 1,
    },
  ];
  return { parts, total: parts.reduce((s, p) => s + p.points, 0), max: 10 };
}

/** The tree's size, 0 (a seed) to 1 (full grown), from the Grow money. */
export function treeSize(growCents: number) {
  if (growCents <= 0) return 0;
  return Math.min(1, Math.pow(growCents / FULL_GROWN, 0.62));
}

/** How much of the tree is gold: the share of the Grow money that is growth. */
export function goldShare(g: Pick<TreeGame, 'grow' | 'planted'>) {
  if (g.grow <= 0) return 0;
  return Math.max(0, Math.min(1, (g.grow - g.planted) / g.grow));
}

export const TREE_STAGES = ['A seed', 'A sprout', 'A sapling', 'A young tree', 'A strong tree', 'A golden tree'] as const;

export function treeStage(growCents: number) {
  const s = treeSize(growCents);
  if (s <= 0) return TREE_STAGES[0];
  if (s < 0.28) return TREE_STAGES[1];
  if (s < 0.5) return TREE_STAGES[2];
  if (s < 0.72) return TREE_STAGES[3];
  if (s < 0.92) return TREE_STAGES[4];
  return TREE_STAGES[5];
}

/** $12, $12.50, −$6 (a true minus sign). Cents only when there are some. */
export function formatMoney(cents: number) {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const part = abs % 100;
  return `${sign}$${whole}${part ? `.${String(part).padStart(2, '0')}` : ''}`;
}
