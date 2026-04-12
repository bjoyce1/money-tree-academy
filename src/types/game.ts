export type Coin = number;

export type AchievementId =
  | "first_login"
  | "finish_first_chapter"
  | "perfect_quiz"
  | "seven_day_streak"
  | "thirty_day_streak"
  | "first_highlight"
  | "ten_quizzes"
  | "mini_game_master";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  coins: Coin;
  condition: (ctx: UserProgress) => boolean;
  once?: boolean;
}

export type GuideId = "aisha" | "emma" | "liam" | "mateo";

export interface UserProgress {
  uid: string;
  firstLoginAt?: string;
  chaptersCompleted: Record<string, boolean>;
  quizResults: { chapterId: string; scorePct: number; timestamp: string }[];
  streakDays: number;
  highlightsCount: number;
  miniGamesCompleted: Record<string, number>;
  coins: Coin;
  achievementsUnlocked: Partial<Record<AchievementId, string>>;
  selectedGuide?: GuideId;
  purchasedItems: Record<string, boolean>;
}

export interface ShopItem {
  sku: string;
  name: string;
  type: "avatar" | "tree_decor" | "theme";
  price: Coin;
  icon: string;
  description: string;
}
// AI Chat types (stub for now)
export interface AiChatConversation {
  id: string;
  title: string;
  chapterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
