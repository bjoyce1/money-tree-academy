/**
 * Chapter openers in the book, as seq indexes (see book.ts). Kept free of the
 * page-text JSON so other routes (the home page) can import it cheaply.
 * Printed page number = seq + 1.
 */

export interface Chapter {
  label: string;
  title: string;
  /** seq index of the chapter's first page */
  seq: number;
}

export const TOTAL_PAGES = 58;

export const CHAPTERS: Chapter[] = [
  { label: "Cover", title: "The Money Tree of Life", seq: 0 },
  { label: "Title Page", title: "Title & Dedication", seq: 2 },
  { label: "Contents", title: "Contents", seq: 4 },
  { label: "Chapter 1", title: "The Day the Tree Chose Them", seq: 5 },
  { label: "Chapter 2", title: "What Is Money, Really?", seq: 10 },
  { label: "Chapter 3", title: "The Want That Felt Like a Need", seq: 14 },
  { label: "Chapter 4", title: "Earn It, Don’t Just Ask for It", seq: 17 },
  { label: "Chapter 5", title: "Save First, Spend Second", seq: 20 },
  { label: "Chapter 6", title: "Give Every Dollar a Job", seq: 23 },
  { label: "Chapter 7", title: "Where Does the Money Go?", seq: 26 },
  { label: "Chapter 8", title: "Credit Is Borrowed Trust", seq: 29 },
  { label: "Chapter 9", title: "Make Your Money Work", seq: 32 },
  { label: "Chapter 10", title: "Turn an Idea Into a Business", seq: 35 },
  { label: "Chapter 11", title: "When Wealth Grows Roots", seq: 38 },
  { label: "Chapter 12", title: "Build Something That Lasts", seq: 41 },
  { label: "Epilogue", title: "The Seed in Your Hands", seq: 45 },
  { label: "For Parents", title: "A Letter to Parents and Caregivers", seq: 46 },
  { label: "Glossary", title: "Money Tree Glossary", seq: 47 },
  { label: "Challenge", title: "The 30-Day Money Tree Challenge", seq: 50 },
  { label: "Answer Key", title: "Answer Key and Educator Notes", seq: 52 },
  { label: "Back Cover", title: "Back Cover", seq: TOTAL_PAGES - 1 },
];

/** Link that opens the flip book at a printed page number. */
export const flipbookHref = (printedPage: number) => `/flipbook?page=${printedPage}`;
