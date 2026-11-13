// Money games: practice for the book's ideas. Content and scoring live here
// so they can be tested; the components only draw them.

import { useSyncExternalStore } from 'react';
import { GLOSSARY, type GlossaryTerm } from '@/data/content';
import { earnCoins } from './rewards';

export type GameId = 'grow-the-tree' | 'market-day' | 'every-dollar' | 'how-long' | 'class-party' | 'money-words';

/** `href` marks a game with a page of its own (and `goesWith` names its chapters); the others open in a dialog. */
export const GAMES: { id: GameId; name: string; about: string; chapter: string; href?: string; goesWith?: string }[] = [
  { id: 'grow-the-tree', name: 'Grow the Tree', about: 'Eight seasons, three jars. Save for a goal and watch your tree grow.', chapter: 'save-first-spend-second', href: '/play/grow-the-tree', goesWith: 'Chapters 5 and 9' },
  { id: 'market-day', name: 'Market Day', about: 'Run the Fun Pack stand for five days. Set a price, make your packs, and count the profit.', chapter: 'what-is-money-really', href: '/play/market-day', goesWith: 'Chapters 2 and 10' },
  { id: 'every-dollar', name: 'Give every dollar a job', about: 'Sort each choice: need, want, save or give.', chapter: 'save-first-spend-second' },
  { id: 'how-long', name: 'How long to save?', about: 'Work out how many weeks, days or months a goal takes.', chapter: 'save-first-spend-second' },
  { id: 'class-party', name: 'Plan the class party', about: 'Spend $50 to help the most classmates.', chapter: 'turn-an-idea-into-a-business' },
  { id: 'money-words', name: 'Match the money words', about: 'Pair five words from the book with what they mean.', chapter: 'what-is-money-really' },
];

// ------------------------------------------------------------ every dollar

export type Job = 'need' | 'want' | 'save' | 'give';
export const JOBS: { id: Job; label: string; hint: string }[] = [
  { id: 'need', label: 'Need', hint: 'Must have' },
  { id: 'want', label: 'Want', hint: 'Nice to have' },
  { id: 'save', label: 'Save', hint: 'For later' },
  { id: 'give', label: 'Give', hint: 'To help others' },
];

export const SORT_ITEMS: { name: string; amount: number; job: Job }[] = [
  { name: 'Lunch for school', amount: 5, job: 'need' },
  { name: 'Shoes with glowing soles', amount: 140, job: 'want' },
  { name: 'Money for a drawing-tablet fund', amount: 10, job: 'save' },
  { name: 'Cans for the food drive', amount: 6, job: 'give' },
  { name: 'Bus fare to school', amount: 2, job: 'need' },
  { name: 'A new skin in a video game', amount: 8, job: 'want' },
  { name: 'Emergency money in a savings account', amount: 15, job: 'save' },
  { name: 'A card and gift for a sick neighbor', amount: 7, job: 'give' },
];

// ------------------------------------------------------------- how long

export type SavingsQuestion = { goal: string; cost: number; perPeriod: number; period: 'day' | 'week' | 'month' };

export const SAVINGS_QUESTIONS: SavingsQuestion[] = [
  { goal: 'Black-and-gold shoes', cost: 140, perPeriod: 10, period: 'week' },
  { goal: 'A drawing tablet', cost: 120, perPeriod: 15, period: 'week' },
  { goal: 'Supplies for a snack-pack sale', cost: 36, perPeriod: 4, period: 'day' },
  { goal: 'A family trip fund', cost: 300, perPeriod: 25, period: 'month' },
];

/** Whole periods needed, rounding up: you cannot buy it until you have it all. */
export const periodsToSave = (q: SavingsQuestion) => Math.ceil(q.cost / q.perPeriod);

// ------------------------------------------------------------ class party

export const PARTY_BUDGET = 50;

export const PARTY_ITEMS: { name: string; price: number; helps: number }[] = [
  { name: 'Sandwich tray', price: 18, helps: 20 },
  { name: 'Bowl of fruit', price: 9, helps: 15 },
  { name: 'Bottled water', price: 6, helps: 20 },
  { name: 'Speaker for music', price: 12, helps: 12 },
  { name: 'Paper decorations', price: 5, helps: 8 },
  { name: 'Giant cake', price: 25, helps: 14 },
  { name: 'Balloon arch', price: 20, helps: 5 },
  { name: 'Candy bags', price: 15, helps: 6 },
];

/** The most classmates any plan within budget can help (small knapsack). */
export function bestPartyHelp(items = PARTY_ITEMS, budget = PARTY_BUDGET) {
  const best = new Array(budget + 1).fill(0);
  for (const it of items) for (let b = budget; b >= it.price; b--) best[b] = Math.max(best[b], best[b - it.price] + it.helps);
  return best[budget];
}

/** Score out of 10 against the best possible plan. */
export function partyScore(chosen: string[]) {
  const picked = PARTY_ITEMS.filter((i) => chosen.includes(i.name));
  const spent = picked.reduce((s, i) => s + i.price, 0);
  if (spent > PARTY_BUDGET) return 0;
  const helped = picked.reduce((s, i) => s + i.helps, 0);
  return Math.round((10 * helped) / bestPartyHelp());
}

// ------------------------------------------------------------ money words

/** n glossary terms with short, distinct definitions, in a random order. */
export function pickMatchTerms(n = 5, rand = Math.random): GlossaryTerm[] {
  const pool = GLOSSARY.filter((g) => g.shortDefinition.length <= 70);
  const out: GlossaryTerm[] = [];
  const copy = [...pool];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}

export function shuffle<T>(list: T[], rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- scores

type ScoreRecord = { gameId: string; score: number; maxScore: number; completed: boolean; date: string };
const KEY = 'mini_game_scores';
const CHANGED = 'games-changed';

function readScores(): ScoreRecord[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Best score as a percentage for each game played. */
export function bestScores(): Partial<Record<GameId, number>> {
  const out: Partial<Record<GameId, number>> = {};
  for (const s of readScores()) {
    const pct = Math.round((100 * s.score) / Math.max(1, s.maxScore));
    const id = s.gameId as GameId;
    out[id] = Math.max(out[id] ?? 0, pct);
  }
  return out;
}

const coinsFor = (pct: number) => (pct === 100 ? 30 : pct >= 80 ? 25 : pct >= 60 ? 20 : 15);

/** Save a finished game. Coins are earned once per game per day. Returns the coins earned. */
export function recordGame(gameId: GameId, score: number, maxScore: number, today = new Date()) {
  const date = today.toISOString().slice(0, 10);
  const scores = readScores();
  const playedToday = scores.some((s) => s.gameId === gameId && s.date === date);
  scores.push({ gameId, score, maxScore, completed: true, date });
  try {
    localStorage.setItem(KEY, JSON.stringify(scores.slice(-100)));
  } catch {
    /* ignore */
  }
  cache = null;
  window.dispatchEvent(new Event(CHANGED));
  if (playedToday) return 0;
  const name = GAMES.find((g) => g.id === gameId)?.name ?? 'Money game';
  const coins = coinsFor(Math.round((100 * score) / Math.max(1, maxScore)));
  earnCoins(coins, name, 'game');
  return coins;
}

let cache: Partial<Record<GameId, number>> | null = null;
const snapshot = () => (cache ??= bestScores());

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

export function useBestScores() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function resetGamesCache() {
  cache = null;
}
