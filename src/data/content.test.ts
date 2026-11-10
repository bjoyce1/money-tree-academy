import { describe, expect, it } from 'vitest';
import {
  CHAPTERS,
  GLOSSARY,
  QUIZZES,
  STORY_CHAPTER_COUNT,
  chapterMark,
  findTerm,
  getQuiz,
  storyHtml,
  storyText,
} from './content';

describe('chapters', () => {
  it('has twelve chapters and an epilogue, in order', () => {
    expect(CHAPTERS).toHaveLength(13);
    expect(STORY_CHAPTER_COUNT).toBe(12);
    expect(CHAPTERS.map((c) => c.order)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    expect(CHAPTERS.at(-1)!.label).toBe('Epilogue');
    expect(chapterMark(CHAPTERS.at(-1)!)).toBe('E');
    expect(chapterMark(CHAPTERS[0])).toBe('1');
  });

  it('has unique ids and url-safe slugs', () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    expect(new Set(CHAPTERS.map((c) => c.slug)).size).toBe(CHAPTERS.length);
    for (const c of CHAPTERS) expect(c.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('gives every numbered chapter a complete kit, and the epilogue none', () => {
    for (const c of CHAPTERS.slice(0, 12)) {
      expect(c.kit, c.id).not.toBeNull();
      const k = c.kit!;
      for (const field of ['lesson', 'reneeTip', 'alexTip', 'challenge', 'conversation', 'review', 'parentNote'] as const) {
        expect(k[field].length, `${c.id}.${field}`).toBeGreaterThan(10);
      }
      expect(k.words.length, `${c.id}.words`).toBeGreaterThan(2);
      expect(c.summary).toBe(k.lesson);
    }
    expect(CHAPTERS[12].kit).toBeNull();
  });

  it('keeps the kit out of the story text', () => {
    for (const c of CHAPTERS) {
      expect(c.sections[0].htmlBody).not.toContain('mt-kit');
      expect(storyText(c)).not.toContain('Money Tree Challenge');
    }
  });

  it('links only glossary words that exist', () => {
    for (const c of CHAPTERS) {
      for (const m of c.sections[0].htmlBody.matchAll(/\[\[(.+?)\]\]/g)) {
        expect(findTerm(m[1]), `${c.id}: ${m[1]}`).toBeDefined();
      }
    }
  });

  it('renders glossary words as popover slots without breaking markup', () => {
    const html = storyHtml(CHAPTERS[0]);
    expect(html).not.toContain('[[');
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    // A clean round trip means every tag was balanced.
    expect(doc.body.firstElementChild!.innerHTML.length).toBeGreaterThan(html.length * 0.9);
  });
});

describe('quizzes', () => {
  it('has one quiz per chapter, reachable from the chapter', () => {
    expect(QUIZZES).toHaveLength(CHAPTERS.length);
    for (const c of CHAPTERS) expect(getQuiz(c.quizId), c.id).toBeDefined();
  });

  it('has answer keys that point at real choices', () => {
    for (const q of QUIZZES) {
      for (const question of q.questions) {
        expect(question.answerKey.length, `${q.id}/${question.id}`).toBeGreaterThan(0);
        if (question.type === 'single') expect(question.answerKey).toHaveLength(1);
        for (const i of question.answerKey) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(question.choices.length);
        }
      }
    }
  });
});

describe('glossary', () => {
  it('has unique terms with definitions', () => {
    const terms = GLOSSARY.map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    for (const g of GLOSSARY) expect(g.shortDefinition.length).toBeGreaterThan(5);
  });

  it('finds terms regardless of case and spacing', () => {
    expect(findTerm(' budget ')?.term).toBe('Budget');
    expect(findTerm('not a word')).toBeUndefined();
  });
});
