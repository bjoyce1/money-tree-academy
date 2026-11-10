/**
 * Home page copy, taken from the book itself (The Money Tree of Life,
 * preview edition). Lessons are the book's own "Money Tree Lessons" lines.
 */
import { flipbookHref } from "@/flipbook/chapters";

export interface IndexEntry {
  number: string;
  title: string;
  lesson: string;
  image: string;
  alt: string;
  /** printed page number where the chapter opens */
  page: number;
}

const art = (name: string) => `/home/chapters/${name}.webp`;

export const INDEX: IndexEntry[] = [
  {
    number: "1",
    title: "The Day the Tree Chose Them",
    lesson: "Money is a tool. People can use it to buy, save, grow, give, and build opportunities.",
    image: art("chapter-1"),
    alt: "Renee and Alex at Discovery Green in Houston as a golden leaf glows in Renee's hand.",
    page: 6,
  },
  {
    number: "2",
    title: "What Is Money, Really?",
    lesson: "Money helps people trade value. Revenue minus costs equals profit.",
    image: art("chapter-2"),
    alt: "Renee and Alex selling their Money Tree Fun Packs at the Youth Market.",
    page: 11,
  },
  {
    number: "3",
    title: "The Want That Felt Like a Need",
    lesson: "Needs come first. Wants are not bad, but they can wait.",
    image: art("chapter-3"),
    alt: "Alex looking at glowing sneakers in a shop window while Renee watches.",
    page: 15,
  },
  {
    number: "4",
    title: "Earn It, Don’t Just Ask for It",
    lesson: "Useful work can create income through time, effort, skill, products, and services.",
    image: art("chapter-4"),
    alt: "Renee and Alex sorting boxes in Mrs. Carter's garage.",
    page: 18,
  },
  {
    number: "5",
    title: "Save First, Spend Second",
    lesson: "Saving means keeping money for later. Save first, not last.",
    image: art("chapter-5"),
    alt: "Renee and Alex with three glass jars labeled Spend, Save, and Grow.",
    page: 21,
  },
  {
    number: "6",
    title: "Give Every Dollar a Job",
    lesson: "A budget is a plan for money coming in and going out.",
    image: art("chapter-6"),
    alt: "Renee and Alex writing a budget plan together.",
    page: 24,
  },
  {
    number: "7",
    title: "Where Does the Money Go?",
    lesson: "Banks and credit unions can help people store, move, track, and protect money.",
    image: art("chapter-7"),
    alt: "A credit union adviser showing Renee and Alex an account on a tablet.",
    page: 27,
  },
  {
    number: "8",
    title: "Credit Is Borrowed Trust",
    lesson: "Credit is borrowed trust. Debt is money owed. Borrowing has a total cost.",
    image: art("chapter-8"),
    alt: "Renee and Alex beside glowing signs reading Borrow, Repay, and Trust.",
    page: 30,
  },
  {
    number: "9",
    title: "Make Your Money Work",
    lesson: "Investing may help long-term goals, but all investments include risk.",
    image: art("chapter-9"),
    alt: "Four plants in pots labeled Savings, Business, Stocks, and Crypto.",
    page: 33,
  },
  {
    number: "10",
    title: "Turn an Idea Into a Business",
    lesson: "A business solves a problem and creates value for a customer.",
    image: art("chapter-10"),
    alt: "Renee and Alex selling Money Tree Market Packs at a community sale.",
    page: 36,
  },
  {
    number: "11",
    title: "When Wealth Grows Roots",
    lesson: "Giving can include money, time, work, and knowledge. Wise giving protects dignity.",
    image: art("chapter-11"),
    alt: "Renee and Alex volunteering at a community food pantry.",
    page: 39,
  },
  {
    number: "12",
    title: "Build Something That Lasts",
    lesson:
      "Generational wealth includes money, ownership, knowledge, habits, and opportunity passed forward.",
    image: art("chapter-12"),
    alt: "Renee and Alex holding the Family Wealth Book under the glowing Money Tree.",
    page: 42,
  },
  {
    number: "E",
    title: "The Seed in Your Hands",
    lesson: "A lesson practiced becomes a habit. A habit repeated becomes a system.",
    image: art("epilogue"),
    alt: "A family gathered around a table for Family Money Night.",
    page: 46,
  },
];

/** The end-of-chapter kit. Boxes are measured from the ink on printed page 13 (012-md.webp), in % of page height, padded ~1%. */
export interface KitPart {
  id: string;
  name: string;
  detail: string;
  box: { top: number; height: number };
}

export const KIT: KitPart[] = [
  {
    id: "lesson",
    name: "Money Tree Lessons",
    detail: "The chapter's idea in a sentence a child can repeat.",
    box: { top: 24.2, height: 9.0 },
  },
  {
    id: "words",
    name: "New Money Words",
    detail: "The vocabulary from the story, from barter to profit.",
    box: { top: 33.8, height: 18.1 },
  },
  {
    id: "tips",
    name: "Renee’s and Alex’s tips",
    detail: "Two ways to use the lesson: the saver’s and the builder’s.",
    box: { top: 52.7, height: 12.2 },
  },
  {
    id: "challenge",
    name: "Money Tree Challenge",
    detail: "One small, safe thing to try this week.",
    box: { top: 65.6, height: 8.6 },
  },
  {
    id: "conversation",
    name: "Family Conversation",
    detail: "A question for the adults to answer too.",
    box: { top: 74.6, height: 8.2 },
  },
];

export const EXTRAS = [
  { title: "Letter & Family Pledge", page: 47, image: "/home/page-47.webp" },
  { title: "Money Tree Glossary", page: 48, image: "/home/page-48.webp" },
  { title: "30-Day Money Tree Challenge", page: 51, image: "/home/page-51.webp" },
  { title: "Answer Key & Educator Notes", page: 53, image: "/home/page-53.webp" },
  { title: "Certificate of Financial Growth", page: 55, image: "/home/page-55.webp" },
] as const;

export const VERBS = [
  "earn",
  "save",
  "budget",
  "bank",
  "borrow carefully",
  "invest with patience",
  "build a business",
  "give with purpose",
  "pass knowledge forward",
];

export { flipbookHref };
