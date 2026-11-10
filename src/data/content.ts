// Typed access to the reader's content, generated from the book PDF by
// scripts/build-reader-content.py. Import from here rather than the JSON.
import chaptersJson from './chapters.json';
import glossaryJson from './glossary.json';
import quizzesJson from './quizzes.json';

export type ChapterKit = {
  lesson: string;
  words: string[];
  reneeTip: string;
  alexTip: string;
  challenge: string;
  conversation: string;
  review: string;
  parentNote: string;
};

export type Chapter = {
  id: string;
  slug: string;
  label: string;
  title: string;
  summary: string;
  order: number;
  estReadMinutes: number;
  sections: { id: string; htmlBody: string }[];
  kit: ChapterKit | null;
  quizId: string;
  printedPage: number;
};

export type GlossaryTerm = { id: string; term: string; shortDefinition: string };

export type QuizQuestion = {
  id: string;
  type: 'single' | 'multi';
  prompt: string;
  choices: string[];
  answerKey: number[];
  explanation?: string;
};

export type Quiz = { id: string; questions: QuizQuestion[] };

export const CHAPTERS = chaptersJson as Chapter[];
export const GLOSSARY = glossaryJson as GlossaryTerm[];
export const QUIZZES = quizzesJson as Quiz[];

/** The numbered chapters, without the epilogue. */
export const STORY_CHAPTER_COUNT = CHAPTERS.filter((c) => c.kit !== null).length;

export const isEpilogue = (c: Pick<Chapter, 'label'>) => c.label === 'Epilogue';

export const getChapter = (slug: string | undefined) => CHAPTERS.find((c) => c.slug === slug);

export const getQuiz = (id: string | undefined) => QUIZZES.find((q) => q.id === id);

export const findTerm = (term: string) => {
  const t = term.trim().toLowerCase();
  return GLOSSARY.find((g) => g.term.toLowerCase() === t);
};

/** "1" … "12", or "E" for the epilogue; for compact chapter lists. */
export const chapterMark = (c: Pick<Chapter, 'label' | 'order'>) => (isEpilogue(c) ? 'E' : String(c.order));

/** The chapter's story HTML with glossary terms turned into popover slots. */
export function storyHtml(c: Chapter) {
  return c.sections
    .map((s) => s.htmlBody)
    .join('')
    .replace(/\[\[(.+?)\]\]/g, (_m, term: string) => `<span data-popover="${term}">${term}</span>`);
}

/** Plain text of the story, for listening and word counts. */
export function storyText(c: Chapter) {
  return c.sections
    .map((s) => s.htmlBody)
    .join(' ')
    .replace(/\[\[(.+?)\]\]/g, '$1')
    .replace(/<\/(p|h3|h4|li)>/g, '$&\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

export function wordCount(c: Chapter) {
  return storyText(c).split(/\s+/).filter(Boolean).length;
}

/** The chapter's opening illustration (720×931), cropped from the book. */
export const chapterArt = (c: Pick<Chapter, 'label' | 'order'>) =>
  isEpilogue(c) ? '/home/chapters/epilogue.webp' : `/home/chapters/chapter-${c.order}.webp`;

export const ART_WIDTH = 720;
export const ART_HEIGHT = 931;
