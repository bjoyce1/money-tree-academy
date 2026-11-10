// Reading rewards: coins, the reading streak, achievements and chapter
// completion. One module owns the stored data so rewards are earned the
// same way wherever they are triggered, and any page can show them.
//
// Storage keys are the ones the app has always used, so saved progress
// carries over: coins_data, reading_streaks, achievement_stats,
// achievements_unlocked, completed_chapters, quiz_results_<quizId>.

import { useSyncExternalStore } from 'react';

export type CoinCategory = 'reading' | 'achievement' | 'streak' | 'quiz' | 'daily' | 'purchase' | 'bonus' | 'game';

export type CoinTransaction = {
  id: string;
  amount: number;
  reason: string;
  type: 'earned' | 'spent';
  timestamp: number;
  category: CoinCategory;
};

export type CoinsData = {
  totalCoins: number;
  totalEarned: number;
  totalSpent: number;
  transactions: CoinTransaction[];
  lastDailyBonus: string;
  streakMultiplier: number;
  lastActivity?: number;
};

export type StreakData = { lastReadISO: string; streakCount: number; longestStreak: number };

export type StatKey =
  | 'chaptersCompleted'
  | 'notesCreated'
  | 'glossaryUsed'
  | 'textHighlighted'
  | 'quizzesCompleted'
  | 'bookmarksCreated'
  | 'activitiesCompleted'
  | 'totalReadingTime';

export type Stats = Record<StatKey, number>;

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  stat: StatKey;
  requirement: number;
  rarity: Rarity;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-chapter', name: 'First Steps', description: 'Finish your first chapter', stat: 'chaptersCompleted', requirement: 1, rarity: 'common' },
  { id: 'chapter-explorer', name: 'Chapter Explorer', description: 'Finish 3 chapters', stat: 'chaptersCompleted', requirement: 3, rarity: 'common' },
  { id: 'halfway-hero', name: 'Halfway Hero', description: 'Finish 6 chapters', stat: 'chaptersCompleted', requirement: 6, rarity: 'uncommon' },
  { id: 'book-master', name: 'Book Master', description: 'Finish all 12 chapters', stat: 'chaptersCompleted', requirement: 12, rarity: 'legendary' },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Complete 5 chapter quizzes', stat: 'quizzesCompleted', requirement: 5, rarity: 'uncommon' },
  { id: 'challenge-taker', name: 'Challenge Taker', description: 'Do 3 Money Tree Challenges', stat: 'activitiesCompleted', requirement: 3, rarity: 'rare' },
  { id: 'word-collector', name: 'Word Collector', description: 'Look up 10 money words', stat: 'glossaryUsed', requirement: 10, rarity: 'common' },
  { id: 'note-taker', name: 'Note Taker', description: 'Write your first note', stat: 'notesCreated', requirement: 1, rarity: 'common' },
  { id: 'thoughtful-reader', name: 'Thoughtful Reader', description: 'Write 5 notes', stat: 'notesCreated', requirement: 5, rarity: 'uncommon' },
  { id: 'highlighter', name: 'Highlighter', description: 'Highlight 10 passages', stat: 'textHighlighted', requirement: 10, rarity: 'common' },
  { id: 'bookworm', name: 'Bookworm', description: 'Save 10 bookmarks', stat: 'bookmarksCreated', requirement: 10, rarity: 'uncommon' },
  { id: 'dedicated-reader', name: 'Dedicated Reader', description: 'Read for 60 minutes in all', stat: 'totalReadingTime', requirement: 60, rarity: 'rare' },
];

const RARITY_COINS: Record<Rarity, number> = { common: 10, uncommon: 20, rare: 30, legendary: 50 };

export const STREAK_BADGES = [
  { id: 'first-read', name: 'First Day', requirement: 1 },
  { id: 'streak-3', name: 'Three in a Row', requirement: 3 },
  { id: 'streak-7', name: 'Week of Reading', requirement: 7 },
  { id: 'streak-14', name: 'Two Weeks Strong', requirement: 14 },
  { id: 'streak-30', name: 'Month of Reading', requirement: 30 },
] as const;

// ------------------------------------------------------------------ storage

const CHANGED = 'rewards-changed';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function readArray(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked or full */
  }
}

let version = 0;
function changed() {
  version += 1;
  snapshotCache = null;
  window.dispatchEvent(new Event(CHANGED));
  // Older components reload coins on this event.
  window.dispatchEvent(new Event('coins-updated'));
}

// -------------------------------------------------------------------- coins

const EMPTY_COINS: CoinsData = {
  totalCoins: 0,
  totalEarned: 0,
  totalSpent: 0,
  transactions: [],
  lastDailyBonus: '',
  streakMultiplier: 1,
};

export const getCoins = () => read<CoinsData>('coins_data', EMPTY_COINS);

const txId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function earnCoins(amount: number, reason: string, category: CoinCategory) {
  const n = Math.max(0, Math.round(amount));
  if (!n) return;
  const c = getCoins();
  write('coins_data', {
    ...c,
    totalCoins: c.totalCoins + n,
    totalEarned: c.totalEarned + n,
    transactions: [{ id: txId(), amount: n, reason, type: 'earned' as const, timestamp: Date.now(), category }, ...c.transactions].slice(0, 50),
    lastActivity: Date.now(),
  } satisfies CoinsData);
  changed();
}

export function spendCoins(amount: number, reason: string): boolean {
  const c = getCoins();
  if (amount <= 0 || c.totalCoins < amount) return false;
  write('coins_data', {
    ...c,
    totalCoins: c.totalCoins - amount,
    totalSpent: c.totalSpent + amount,
    transactions: [{ id: txId(), amount, reason, type: 'spent' as const, timestamp: Date.now(), category: 'purchase' as const }, ...c.transactions].slice(0, 50),
    lastActivity: Date.now(),
  } satisfies CoinsData);
  changed();
  return true;
}

// ------------------------------------------------------------------- streak

export const getStreak = () => read<StreakData>('reading_streaks', { lastReadISO: '', streakCount: 0, longestStreak: 0 });

const dayNumber = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

/** The streak as it stands today: it lapses if yesterday was missed. */
export function currentStreak(now = new Date()) {
  const s = getStreak();
  if (!s.lastReadISO) return 0;
  const gap = dayNumber(now) - dayNumber(new Date(s.lastReadISO));
  return gap <= 1 ? s.streakCount : 0;
}

export function readToday(now = new Date()) {
  const s = getStreak();
  return !!s.lastReadISO && dayNumber(new Date(s.lastReadISO)) === dayNumber(now);
}

/** Count today as a reading day. Returns the new streak, or null if today already counted. */
export function recordReadingDay(now = new Date()): number | null {
  const s = getStreak();
  let streak = 1;
  if (s.lastReadISO) {
    const gap = dayNumber(now) - dayNumber(new Date(s.lastReadISO));
    if (gap === 0) return null;
    if (gap === 1) streak = s.streakCount + 1;
  }
  write('reading_streaks', {
    lastReadISO: now.toISOString(),
    streakCount: streak,
    longestStreak: Math.max(s.longestStreak, streak),
  } satisfies StreakData);
  earnCoins(Math.min(5 + streak * 2, 20), streak === 1 ? 'Reading today' : `${streak}-day reading streak`, 'streak');
  return streak;
}

// --------------------------------------------------------- chapters & stats

export const getCompleted = () => readArray('completed_chapters');

export const isCompleted = (chapterId: string) => getCompleted().includes(chapterId);

const EMPTY_STATS: Stats = {
  chaptersCompleted: 0,
  notesCreated: 0,
  glossaryUsed: 0,
  textHighlighted: 0,
  quizzesCompleted: 0,
  bookmarksCreated: 0,
  activitiesCompleted: 0,
  totalReadingTime: 0,
};

/** Counted events, never lower than what is actually saved. */
export function getStats(): Stats {
  const stored = read<Stats>('achievement_stats', EMPTY_STATS);
  let quizzes = 0;
  try {
    quizzes = Object.keys(localStorage).filter((k) => k.startsWith('quiz_results_')).length;
  } catch {
    /* ignore */
  }
  return {
    ...stored,
    chaptersCompleted: Math.max(stored.chaptersCompleted, getCompleted().length),
    quizzesCompleted: Math.max(stored.quizzesCompleted, quizzes),
    bookmarksCreated: Math.max(stored.bookmarksCreated, readArray('user_bookmarks').length),
  };
}

const EVENT_STAT: Record<string, StatKey> = {
  'chapter-completed': 'chaptersCompleted',
  'note-created': 'notesCreated',
  'glossary-used': 'glossaryUsed',
  'text-highlighted': 'textHighlighted',
  'quiz-completed': 'quizzesCompleted',
  'bookmark-created': 'bookmarksCreated',
  'activity-completed': 'activitiesCompleted',
  'reading-time': 'totalReadingTime',
};

/** Record an activity (the legacy `achievement-event` types) and unlock what it earns. */
export function recordActivity(type: string, data?: { minutes?: number; count?: number }) {
  const key = EVENT_STAT[type];
  if (!key) return;
  // Increment the counted value; getStats() then takes the larger of the
  // count and what is actually saved, so nothing is counted twice.
  const counted = read<Stats>('achievement_stats', EMPTY_STATS);
  if (type === 'chapter-completed') counted[key] = Math.max(counted[key], data?.count ?? counted[key] + 1);
  else counted[key] += type === 'reading-time' ? data?.minutes ?? 1 : 1;
  write('achievement_stats', counted);
  unlockAchievements(getStats());
  changed();
}

export function getUnlocked(): Record<string, string> {
  return read<Record<string, string>>('achievements_unlocked', {});
}

function unlockAchievements(stats: Stats) {
  const unlocked = getUnlocked();
  const fresh = ACHIEVEMENTS.filter((a) => !unlocked[a.id] && stats[a.stat] >= a.requirement);
  if (!fresh.length) return;
  const today = new Date().toISOString().slice(0, 10);
  for (const a of fresh) unlocked[a.id] = today;
  write('achievements_unlocked', unlocked);
  for (const a of fresh) {
    earnCoins(RARITY_COINS[a.rarity], `Achievement: ${a.name}`, 'achievement');
    window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: a }));
  }
}

/** Mark a chapter finished: counts once, earns coins and a reading day. */
export function completeChapter(chapterId: string, label: string) {
  const done = getCompleted();
  if (done.includes(chapterId)) return false;
  write('completed_chapters', [...done, chapterId]);
  earnCoins(20, `Finished ${label}`, 'reading');
  recordActivity('chapter-completed', { count: done.length + 1 });
  recordReadingDay();
  return true;
}

// -------------------------------------------------------------------- quiz

export type QuizResult = { score: number; total: number; answers: Record<string, number[]>; completedAt: number };

export function getQuizResult(quizId: string): QuizResult | null {
  try {
    const raw = localStorage.getItem(`quiz_results_${quizId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Save a quiz attempt. Coins are earned the first time, plus a bonus for a perfect score. */
export function saveQuizResult(quizId: string, result: Omit<QuizResult, 'completedAt'>) {
  const first = !getQuizResult(quizId);
  const prevBest = getQuizResult(quizId)?.score ?? -1;
  // Count the quiz before saving it: saved results also feed the count.
  if (first) {
    recordActivity('quiz-completed');
    earnCoins(10 + result.score * 5, 'Chapter quiz', 'quiz');
  }
  write(`quiz_results_${quizId}`, { ...result, score: Math.max(prevBest, result.score), completedAt: Date.now() });
  if (result.score === result.total && prevBest < result.total) earnCoins(15, 'Perfect quiz score', 'quiz');
  changed();
}

// ------------------------------------------------------------------- React

export type RewardsSnapshot = {
  coins: CoinsData;
  streak: number;
  longestStreak: number;
  readToday: boolean;
  completed: string[];
  stats: Stats;
  unlocked: Record<string, string>;
  version: number;
};

let snapshotCache: RewardsSnapshot | null = null;

function snapshot(): RewardsSnapshot {
  if (!snapshotCache) {
    snapshotCache = {
      coins: getCoins(),
      streak: currentStreak(),
      longestStreak: getStreak().longestStreak,
      readToday: readToday(),
      completed: getCompleted(),
      stats: getStats(),
      unlocked: getUnlocked(),
      version,
    };
  }
  return snapshotCache;
}

function subscribe(cb: () => void) {
  const onChange = () => {
    snapshotCache = null;
    cb();
  };
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Live view of the reader's rewards; re-renders when anything changes. */
export function useRewards() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** For tests: forget the cached snapshot after editing storage directly. */
export function resetRewardsCache() {
  snapshotCache = null;
}
