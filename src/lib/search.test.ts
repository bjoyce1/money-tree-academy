import { describe, expect, it } from 'vitest';
import { searchBook } from './search';

describe('searchBook', () => {
  it('needs at least two characters', () => {
    expect(searchBook('a').total).toBe(0);
    expect(searchBook('  ').total).toBe(0);
  });

  it('finds money words first, starting-with matches on top', () => {
    const r = searchBook('budget');
    expect(r.terms[0].term).toBe('Budget');
  });

  it('finds story passages with the match marked, ignoring case', () => {
    const r = searchBook('HOUSTON');
    expect(r.passages.length).toBeGreaterThan(0);
    const p = r.passages[0];
    expect(p.match.toLowerCase()).toBe('houston');
    expect(p.chapter.order).toBe(1);
  });

  it('matches curly apostrophes with straight ones', () => {
    expect(searchBook("alex's").passages.length).toBeGreaterThan(0);
  });

  it('limits results per chapter', () => {
    const r = searchBook('money');
    const perChapter = new Map<string, number>();
    for (const p of r.passages) perChapter.set(p.chapter.id, (perChapter.get(p.chapter.id) ?? 0) + 1);
    for (const n of perChapter.values()) expect(n).toBeLessThanOrEqual(3);
  });
});

import { plain } from '@/components/reader/AskGuide';
describe('plain', () => {
  it('drops markdown emphasis and heading marks but keeps maths and lists', () => {
    expect(plain('Save *before* you **spend**!')).toBe('Save before you spend!');
    expect(plain('## Tip\n1. Save 3 * 4 dollars')).toBe('Tip\n1. Save 3 * 4 dollars');
  });
});
