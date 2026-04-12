/**
 * Money Tree of Life — Client Harness Service
 * Calls Supabase Edge Functions for all harness features.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function harnessPost(action: string, body: Record<string, any>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/harness/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Harness ${action} failed: ${res.status}`);
  return res.json();
}

async function harnessGet(action: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/harness/${action}`, {
    method: "POST", // Edge functions use POST
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Harness ${action} failed: ${res.status}`);
  return res.json();
}

export async function fetchRecommendations(input: {
  completedChapters: string[];
  quizResults: { chapterId: string; scorePct: number }[];
  streakDays: number;
  coins: number;
}) {
  return harnessPost("recommendations", input);
}

export async function fetchRecap(currentChapterId: string, completedChapters: string[]) {
  return harnessPost("recap", { currentChapterId, completedChapters });
}

export async function fetchReport(input: {
  completedChapters: string[];
  quizResults: { chapterId: string; scorePct: number }[];
  streakDays: number;
  longestStreak: number;
  coins: number;
  notesCount: number;
  achievementsUnlocked: number;
}) {
  return harnessPost("report", input);
}

export async function scoreResponse(positive: boolean, configUsed: string) {
  return harnessPost("score", { positive, configUsed });
}

export async function fetchHarnessStats() {
  return harnessGet("stats");
}
