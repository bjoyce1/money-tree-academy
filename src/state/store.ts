import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProgress, Achievement, ShopItem } from "@/types/game";

const baseProgress: UserProgress = {
  uid: "local",
  chaptersCompleted: {},
  quizResults: [],
  streakDays: 0,
  highlightsCount: 0,
  miniGamesCompleted: {},
  coins: 0,
  achievementsUnlocked: {},
  purchasedItems: {}
};

const achievementsCatalog: Achievement[] = [
  { id: "first_login", title: "First Login", description: "Welcome aboard! 🌟", icon: "🌟", coins: 10, condition: (c)=>!!c.firstLoginAt },
  { id: "finish_first_chapter", title: "Chapter One!", description: "Completed your first chapter.", icon: "📘", coins: 15, condition: (c)=>Object.values(c.chaptersCompleted).some(Boolean) },
  { id: "perfect_quiz", title: "Quiz Ace", description: "Score 100% on any quiz.", icon: "🏆", coins: 25, condition: (c)=>c.quizResults.some(q=>q.scorePct===100) },
  { id: "seven_day_streak", title: "7-Day Streak", description: "Read 7 days in a row.", icon: "🔥", coins: 50, condition: (c)=>c.streakDays>=7 },
  { id: "thirty_day_streak", title: "30-Day Streak", description: "Read 30 days in a row.", icon: "🏅", coins: 150, condition: (c)=>c.streakDays>=30 },
  { id: "first_highlight", title: "Highlighter", description: "Create your first highlight.", icon: "🖍️", coins: 10, condition: (c)=>c.highlightsCount>=1 },
  { id: "ten_quizzes", title: "Quiz Champ", description: "Complete 10 quizzes.", icon: "🧠", coins: 80, condition: (c)=>c.quizResults.length>=10 },
  { id: "mini_game_master", title: "Mini-Game Master", description: "Reach 80+ in any mini-game.", icon: "🎮", coins: 40, condition: (c)=>Object.values(c.miniGamesCompleted).some(s=>s>=80) },
];

const shopItems: ShopItem[] = [
  { sku:"hat_01", name:"Leaf Cap", type:"avatar", price:40, icon:"🧢", description:"Stylish cap for your avatar." },
  { sku:"tree_light_01", name:"Fairy Lights", type:"tree_decor", price:60, icon:"✨", description:"Sparkly lights for your Tree." },
  { sku:"bg_goldenhour", name:"Golden Hour", type:"theme", price:80, icon:"🌅", description:"Warm chapter background." },
];

type Store = {
  progress: UserProgress;
  achievements: Achievement[];
  shop: ShopItem[];
  addCoins: (n:number)=>void;
  spendCoins: (sku:string, price:number)=>boolean;
  markChapterComplete: (id:string)=>void;
  recordQuiz: (chapterId:string, scorePct:number)=>void;
  setStreakDays: (n:number)=>void;
  incHighlights: ()=>void;
  setMiniGameScore: (gameId:string, score:number)=>void;
  unlockDueAchievements: ()=>void;
  selectGuide: (g: UserProgress["selectedGuide"])=>void;
  ensureFirstLogin: ()=>void;
};

export const useAppStore = create<Store>()(
  persist((set,get)=>({
    progress: baseProgress,
    achievements: achievementsCatalog,
    shop: shopItems,

    addCoins: (n)=>set(s=>({progress:{...s.progress, coins:s.progress.coins+n}})),
    spendCoins: (sku, price)=>{
      const p = get().progress;
      if (p.coins < price || p.purchasedItems[sku]) return false;
      set({progress:{...p, coins:p.coins-price, purchasedItems:{...p.purchasedItems,[sku]:true}}});
      return true;
    },
    markChapterComplete: (id)=>set(s=>({progress:{...s.progress, chaptersCompleted:{...s.progress.chaptersCompleted,[id]:true}}})),
    recordQuiz: (chapterId, scorePct)=>set(s=>({progress:{...s.progress, quizResults:[...s.progress.quizResults,{chapterId,scorePct,timestamp:new Date().toISOString()}]}})),
    setStreakDays: (n)=>set(s=>({progress:{...s.progress, streakDays:n}})),
    incHighlights: ()=>set(s=>({progress:{...s.progress, highlightsCount:s.progress.highlightsCount+1}})),
    setMiniGameScore: (id,score)=>set(s=>({progress:{...s.progress, miniGamesCompleted:{...s.progress.miniGamesCompleted, [id]:Math.max(score, s.progress.miniGamesCompleted[id]||0)}}})),

    unlockDueAchievements: ()=>{
      const s = get();
      const now = new Date().toISOString();
      const unlocked = {...s.progress.achievementsUnlocked};
      let coins = 0;
      s.achievements.forEach(a=>{
        if (!unlocked[a.id] && a.condition(s.progress)) {
          unlocked[a.id] = now;
          coins += a.coins;
        }
      });
      set({progress:{...s.progress, achievementsUnlocked:unlocked, coins:s.progress.coins+coins}});
    },

    selectGuide: (g)=>set(s=>({progress:{...s.progress, selectedGuide:g||s.progress.selectedGuide}})),
    ensureFirstLogin: ()=>set(s=>({progress:{...s.progress, firstLoginAt:s.progress.firstLoginAt ?? new Date().toISOString()}})),
  }),{name:"mtol-progress"})
);