import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "day" | "sepia" | "night" | "contrast" | "pink" | "blue";

interface ReadingState {
  theme: Theme;
  fontSize: number;
  completedChapters: string[];
  currentSlug: string | null;
  coins: number;
  streakDays: number;
  lastReadDate: string | null;
  selectedCharacter: string | null;

  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  markComplete: (slug: string) => void;
  setCurrentSlug: (slug: string | null) => void;
  addCoins: (amount: number) => void;
  updateStreak: () => void;
  setCharacter: (name: string) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      theme: "night",
      fontSize: 18,
      completedChapters: [],
      currentSlug: null,
      coins: 0,
      streakDays: 0,
      lastReadDate: null,
      selectedCharacter: null,

      setTheme: (theme) => {
        set({ theme });
        document.body.classList.remove(
          "theme-day", "theme-sepia", "theme-night", "theme-contrast", "theme-pink", "theme-blue"
        );
        document.body.classList.add(`theme-${theme}`);
      },

      setFontSize: (fontSize) => set({ fontSize }),

      markComplete: (slug) => {
        const { completedChapters } = get();
        if (!completedChapters.includes(slug)) {
          set({ completedChapters: [...completedChapters, slug] });
        }
      },

      setCurrentSlug: (currentSlug) => set({ currentSlug }),

      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

      updateStreak: () => {
        const { lastReadDate, streakDays } = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastReadDate === today) return;
        if (lastReadDate === yesterday) {
          set({ streakDays: streakDays + 1, lastReadDate: today });
        } else {
          set({ streakDays: 1, lastReadDate: today });
        }
      },

      setCharacter: (selectedCharacter) => set({ selectedCharacter }),
    }),
    {
      name: "money-tree-reading",
    }
  )
);
