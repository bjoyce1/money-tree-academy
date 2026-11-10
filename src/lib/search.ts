// Search the book: the story, each chapter's lesson kit, and the money words.
import { CHAPTERS, GLOSSARY, storyText, type Chapter, type GlossaryTerm } from '@/data/content';

export type Passage = {
  chapter: Chapter;
  where: 'story' | 'lesson';
  /** The excerpt split around the match, so it can be shown with the match marked. */
  before: string;
  match: string;
  after: string;
};

export type SearchResults = { terms: GlossaryTerm[]; passages: Passage[]; total: number };

// Length-preserving, so a match found in the folded text lines up with the original.
const fold = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

const EXCERPT = 70;
const MAX_PER_CHAPTER = 3;

function excerpt(text: string, at: number, length: number) {
  let start = Math.max(0, at - EXCERPT);
  let end = Math.min(text.length, at + length + EXCERPT);
  // Snap to word boundaries.
  if (start > 0) start = text.indexOf(' ', start) + 1 || start;
  if (end < text.length) end = text.lastIndexOf(' ', end) > at + length ? text.lastIndexOf(' ', end) : end;
  return {
    before: (start > 0 ? '…' : '') + text.slice(start, at),
    match: text.slice(at, at + length),
    after: text.slice(at + length, end) + (end < text.length ? '…' : ''),
  };
}

function kitText(c: Chapter) {
  const k = c.kit;
  if (!k) return '';
  return [k.lesson, k.reneeTip, k.alexTip, k.challenge, k.conversation].join(' ');
}

// Built once: plain text of every chapter, and its folded twin for matching.
let index: { chapter: Chapter; story: string; storyF: string; kit: string; kitF: string }[] | null = null;
function getIndex() {
  if (!index) {
    index = CHAPTERS.map((chapter) => {
      const story = storyText(chapter).replace(/\s+/g, ' ');
      const kit = kitText(chapter);
      return { chapter, story, storyF: fold(story), kit, kitF: fold(kit) };
    });
  }
  return index;
}

export function searchBook(query: string): SearchResults {
  const q = fold(query.trim());
  if (q.length < 2) return { terms: [], passages: [], total: 0 };

  const terms = GLOSSARY.filter((g) => fold(g.term).includes(q) || fold(g.shortDefinition).includes(q)).sort(
    (a, b) => Number(!fold(a.term).startsWith(q)) - Number(!fold(b.term).startsWith(q)) || a.term.localeCompare(b.term),
  );

  const passages: Passage[] = [];
  for (const entry of getIndex()) {
    let found = 0;
    for (const [where, text, folded] of [
      ['story', entry.story, entry.storyF],
      ['lesson', entry.kit, entry.kitF],
    ] as const) {
      let from = 0;
      while (found < MAX_PER_CHAPTER) {
        const at = folded.indexOf(q, from);
        if (at < 0) break;
        passages.push({ chapter: entry.chapter, where, ...excerpt(text, at, q.length) });
        found += 1;
        from = at + q.length + EXCERPT; // skip overlapping excerpts
      }
    }
  }

  return { terms, passages, total: terms.length + passages.length };
}
