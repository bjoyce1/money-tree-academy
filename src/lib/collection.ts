// The keepsake collection: things from the story a reader can buy with the
// coins they earn by reading, then keep on their shelf on the progress page.
// Stored under the shop's old key (purchased_items), so earlier purchases
// of the story items carry over.

import { useSyncExternalStore } from 'react';
import { earnCoins, spendCoins } from './rewards';

export type Keepsake = {
  id: string;
  name: string;
  /** What it is in the story, in the book's own terms. */
  story: string;
  price: number;
  chapterId: string;
};

export const KEEPSAKES: Keepsake[] = [
  { id: 'golden-leaf', name: 'The Golden Leaf', story: 'The leaf that floated into Alex’s hand with a question written on it.', price: 25, chapterId: 'ch-01' },
  { id: 'golden-seed', name: 'The Golden Seed', story: '“Knowledge does. And knowledge can grow into wealth.”', price: 40, chapterId: 'ch-01' },
  { id: 'alex-shoes', name: 'Glowing Shoes', story: 'The black-and-gold shoes Alex wanted, then saved for.', price: 80, chapterId: 'ch-03' },
  { id: 'renee-jars', name: 'Spend, Save & Grow Jars', story: 'The three jars Renee brought Alex, so every dollar has a job.', price: 35, chapterId: 'ch-05' },
  { id: 'renee-tablet', name: 'Renee’s Drawing Tablet', story: 'The tablet Renee kept a separate fund for, and compared before buying.', price: 75, chapterId: 'ch-05' },
  { id: 'old-sneaker', name: 'The Old Sneaker', story: 'Where Alex kept fifty-eight dollars, before a safer place.', price: 20, chapterId: 'ch-07' },
  { id: 'banking-shield', name: 'The Banking Shield', story: 'STOP, CHECK, ASK and REPORT: the four safety steps.', price: 50, chapterId: 'ch-07' },
  { id: 'alex-market-pack', name: 'Money Tree Market Pack', story: 'The pack Renee and Alex sold together, and the business it became.', price: 40, chapterId: 'ch-11' },
  { id: 'family-pledge', name: 'The Family Pledge', story: 'Thirteen promises a family makes to learn about money together.', price: 60, chapterId: 'ch-13' },
];

/** Items the old shop sold that never did anything; their coins are given back once. */
const RETIRED_PRICES: Record<string, number> = {
  'forest-theme': 50,
  'sunset-theme': 75,
  'ocean-theme': 100,
  'gold-theme': 150,
  'fairy-lights': 40,
  'golden-branches': 80,
  'rainbow-leaves': 120,
  'crystal-tree': 200,
  'particle-effects': 70,
  'confetti-burst': 110,
  'speed-reading': 250,
};

type Owned = Record<string, { purchased: boolean; equipped?: boolean; purchaseDate: string }>;

const KEY = 'purchased_items';
const CHANGED = 'collection-changed';

function readOwned(): Owned {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function writeOwned(o: Owned) {
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
  cache = null;
  window.dispatchEvent(new Event(CHANGED));
}

/** Refund and drop anything bought from the retired catalogue. Safe to call often. */
export function refundRetiredItems(): number {
  const owned = readOwned();
  let refund = 0;
  for (const id of Object.keys(owned)) {
    if (id in RETIRED_PRICES) {
      if (owned[id].purchased) refund += RETIRED_PRICES[id];
      delete owned[id];
    }
  }
  if (refund > 0) earnCoins(refund, 'Refund for retired shop items', 'bonus');
  if (refund > 0 || Object.keys(owned).length !== Object.keys(readOwned()).length) writeOwned(owned);
  return refund;
}

export const isOwned = (id: string) => !!readOwned()[id]?.purchased;

export type BuyResult = 'bought' | 'owned' | 'short' | 'unknown';

export function buyKeepsake(id: string): BuyResult {
  const item = KEEPSAKES.find((k) => k.id === id);
  if (!item) return 'unknown';
  if (isOwned(id)) return 'owned';
  if (!spendCoins(item.price, `Bought ${item.name}`)) return 'short';
  writeOwned({ ...readOwned(), [id]: { purchased: true, purchaseDate: new Date().toISOString() } });
  return 'bought';
}

let cache: string[] | null = null;
const ownedIds = () => (cache ??= KEEPSAKES.filter((k) => readOwned()[k.id]?.purchased).map((k) => k.id));

function subscribe(cb: () => void) {
  const on = () => {
    cache = null;
    cb();
  };
  window.addEventListener(CHANGED, on);
  window.addEventListener('storage', on);
  return () => {
    window.removeEventListener(CHANGED, on);
    window.removeEventListener('storage', on);
  };
}

/** Ids of the keepsakes this reader owns, in catalogue order. */
export function useOwnedKeepsakes() {
  return useSyncExternalStore(subscribe, ownedIds, ownedIds);
}

export function resetCollectionCache() {
  cache = null;
}
