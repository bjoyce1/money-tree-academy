import { apiRequest } from "@/lib/queryClient";

// ─── User API ───────────────────────────────────────────────────────────
export const userAPI = {
  async getUser(): Promise<{ user: any }> {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      return res.json();
    } catch {
      return { user: null };
    }
  },
  async getProfile(): Promise<any> {
    try {
      const res = await apiRequest("GET", "/api/auth/user");
      return res.json();
    } catch { return null; }
  },
  async login(username: string, password: string): Promise<{ user: any }> {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    return res.json();
  },
  async register(username: string, password: string, displayName?: string): Promise<{ user: any }> {
    const res = await apiRequest("POST", "/api/auth/register", { username, password, displayName });
    return res.json();
  },
  async logout(): Promise<{ success: boolean }> {
    const res = await apiRequest("POST", "/api/auth/logout");
    return res.json();
  },
  async updatePreferences(prefs: Record<string, unknown>): Promise<any> {
    try {
      const res = await apiRequest("PATCH", "/api/user/preferences", prefs);
      return res.json();
    } catch { return null; }
  },
};

// ─── Progress API ────────────────────────────────────────────────────────
export const progressAPI = {
  async get(): Promise<any> {
    try {
      const res = await fetch("/api/progress", { credentials: "include" });
      return res.json();
    } catch { return { progress: [] }; }
  },
  async update(resumeSlug?: string, completedChapters?: string[]): Promise<any> {
    // In our simplified server, track via localStorage
    if (resumeSlug) localStorage.setItem("resumeSlug", resumeSlug);
    return { resumeSlug, completedChapters };
  },
  async complete(chapterId: string): Promise<any> {
    try {
      const res = await apiRequest("POST", `/api/progress/${chapterId}/complete`);
      return res.json();
    } catch { return null; }
  },
};

// ─── Notes API ──────────────────────────────────────────────────────────
export const notesAPI = {
  async getByChapter(chapterId: string): Promise<any[]> {
    try {
      const key = `notes_${chapterId}`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch { return []; }
  },
  async create(note: any): Promise<any> {
    try {
      const key = `notes_${note.chapterId}`;
      const notes = JSON.parse(localStorage.getItem(key) || "[]");
      const newNote = { ...note, id: Date.now().toString(), createdAt: new Date().toISOString() };
      notes.push(newNote);
      localStorage.setItem(key, JSON.stringify(notes));
      return newNote;
    } catch { return note; }
  },
  async update(id: string, updates: any): Promise<any> {
    return { id, ...updates };
  },
  async delete(id: string): Promise<void> {
    // Best-effort local deletion
  },
};

// ─── Bookmarks API ──────────────────────────────────────────────────────
export const bookmarksAPI = {
  async getAll(): Promise<any[]> {
    try {
      return JSON.parse(localStorage.getItem("bookmarks") || "[]");
    } catch { return []; }
  },
  async create(bookmark: any): Promise<any> {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      const newBm = { ...bookmark, id: Date.now().toString(), createdAt: new Date().toISOString() };
      bookmarks.push(newBm);
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
      return newBm;
    } catch { return bookmark; }
  },
  async update(id: string, updates: any): Promise<any> {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      const updated = bookmarks.map((b: any) => b.id === id ? { ...b, ...updates } : b);
      localStorage.setItem("bookmarks", JSON.stringify(updated));
      return updated.find((b: any) => b.id === id);
    } catch { return { id, ...updates }; }
  },
  async delete(id: string): Promise<void> {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks.filter((b: any) => b.id !== id)));
    } catch {}
  },
};


// ─── Highlights API ─────────────────────────────────────────────────────
export const highlightsAPI = {
  async getByChapter(chapterId: string): Promise<any[]> {
    try {
      return JSON.parse(localStorage.getItem(`highlights_${chapterId}`) || "[]");
    } catch { return []; }
  },
  async create(highlight: any): Promise<any> {
    try {
      const key = `highlights_${highlight.chapterId}`;
      const highlights = JSON.parse(localStorage.getItem(key) || "[]");
      const newH = { ...highlight, id: Date.now().toString() };
      highlights.push(newH);
      localStorage.setItem(key, JSON.stringify(highlights));
      return newH;
    } catch { return highlight; }
  },
  async delete(id: string): Promise<void> {},
};

// ─── Companion API ──────────────────────────────────────────────────────
export const companionAPI = {
  async get(): Promise<any> {
    try {
      return JSON.parse(localStorage.getItem("character_companion") || "null");
    } catch { return null; }
  },
  async update(data: any): Promise<any> {
    try {
      const current = JSON.parse(localStorage.getItem("character_companion") || "{}");
      const updated = { ...current, ...data };
      localStorage.setItem("character_companion", JSON.stringify(updated));
      return updated;
    } catch { return data; }
  },
};

// ─── Achievements API ────────────────────────────────────────────────────
export const achievementsAPI = {
  async getAll(): Promise<any[]> {
    try {
      return JSON.parse(localStorage.getItem("achievements") || "[]");
    } catch { return []; }
  },
  async create(achievementId: string, progress?: any): Promise<any> {
    try {
      const achievements = JSON.parse(localStorage.getItem("achievements") || "[]");
      const newA = { achievementId, progress, id: Date.now().toString(), earnedAt: new Date().toISOString() };
      if (!achievements.find((a: any) => a.achievementId === achievementId)) {
        achievements.push(newA);
        localStorage.setItem("achievements", JSON.stringify(achievements));
      }
      return newA;
    } catch { return { achievementId }; }
  },
};

// ─── Sessions API (stub) ────────────────────────────────────────────────
export const sessionsAPI = {
  async getAll(): Promise<any[]> { return []; },
  async create(session: any): Promise<any> { return session; },
  async update(id: string, updates: any): Promise<any> { return { id, ...updates }; },
};

// ─── Streaks API ─────────────────────────────────────────────────────────
export const streaksAPI = {
  async get(): Promise<any> {
    try {
      return JSON.parse(localStorage.getItem("reading_streak") || "{ \"currentStreak\": 0, \"longestStreak\": 0 }");
    } catch { return { currentStreak: 0, longestStreak: 0 }; }
  },
  async update(data: any): Promise<any> {
    try {
      const current = JSON.parse(localStorage.getItem("reading_streak") || "{}");
      const updated = { ...current, ...data };
      localStorage.setItem("reading_streak", JSON.stringify(updated));
      return updated;
    } catch { return data; }
  },
};

// ─── Games API ───────────────────────────────────────────────────────────
export const gamesAPI = {
  async getScores(): Promise<any[]> {
    try {
      return JSON.parse(localStorage.getItem("game_scores") || "[]");
    } catch { return []; }
  },
  async submitScore(score: any): Promise<any> {
    try {
      const scores = JSON.parse(localStorage.getItem("game_scores") || "[]");
      const newScore = { ...score, id: Date.now().toString(), playedAt: new Date().toISOString() };
      scores.push(newScore);
      localStorage.setItem("game_scores", JSON.stringify(scores));
      return newScore;
    } catch { return score; }
  },
};

// ─── Shop API ─────────────────────────────────────────────────────────────
export const shopAPI = {
  async getPurchases(): Promise<any[]> {
    try {
      return JSON.parse(localStorage.getItem("purchases") || "[]");
    } catch { return []; }
  },
  async purchase(item: any): Promise<any> {
    try {
      const purchases = JSON.parse(localStorage.getItem("purchases") || "[]");
      const newP = { ...item, id: Date.now().toString(), purchasedAt: new Date().toISOString() };
      purchases.push(newP);
      localStorage.setItem("purchases", JSON.stringify(purchases));
      return newP;
    } catch { return item; }
  },
  async equipItem(id: string, equipped: boolean): Promise<any> {
    return { id, equipped };
  },
};

// ─── Coins API ────────────────────────────────────────────────────────────
export const coinsAPI = {
  async getTransactions(): Promise<any[]> {
    try {
      return JSON.parse(localStorage.getItem("coin_transactions") || "[]");
    } catch { return []; }
  },
  async award(amount: number, reason: string, metadata?: any): Promise<any> {
    try {
      const current = parseInt(localStorage.getItem("coins") || "0");
      localStorage.setItem("coins", String(current + amount));
      const txs = JSON.parse(localStorage.getItem("coin_transactions") || "[]");
      txs.push({ amount, reason, metadata, id: Date.now().toString(), createdAt: new Date().toISOString() });
      localStorage.setItem("coin_transactions", JSON.stringify(txs));
      return { user: { coins: current + amount }, message: `+${amount} coins` };
    } catch { return { user: { coins: 0 }, message: "" }; }
  },
};

// ─── AI API ────────────────────────────────────────────────────────────
export const aiAPI = {
  async chat(message: string, character = "Liam"): Promise<{ reply: string }> {
    try {
      const res = await apiRequest("POST", "/api/ai/chat", { message, character });
      return res.json();
    } catch {
      return { reply: "I'm here to help you learn about money! What would you like to know?" };
    }
  },
};
