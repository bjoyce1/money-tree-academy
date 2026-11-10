import { beforeEach, describe, expect, it } from 'vitest';
import { buyKeepsake, isOwned, refundRetiredItems, resetCollectionCache } from './collection';
import { earnCoins, getCoins, resetRewardsCache } from './rewards';
import { CHAPTERS } from '@/data/content';
import { KEEPSAKES } from './collection';

beforeEach(() => {
  localStorage.clear();
  resetRewardsCache();
  resetCollectionCache();
});

describe('keepsakes', () => {
  it('each points at a real chapter, with a unique id', () => {
    expect(new Set(KEEPSAKES.map((k) => k.id)).size).toBe(KEEPSAKES.length);
    for (const k of KEEPSAKES) expect(CHAPTERS.some((c) => c.id === k.chapterId), k.id).toBe(true);
  });

  it('buys with coins, once, and refuses when short', () => {
    expect(buyKeepsake('golden-leaf')).toBe('short');
    earnCoins(30, 'test', 'bonus');
    expect(buyKeepsake('golden-leaf')).toBe('bought');
    expect(isOwned('golden-leaf')).toBe(true);
    expect(getCoins().totalCoins).toBe(5);
    expect(buyKeepsake('golden-leaf')).toBe('owned');
    expect(buyKeepsake('nope')).toBe('unknown');
  });

  it('refunds retired shop items once and keeps story items', () => {
    localStorage.setItem(
      'purchased_items',
      JSON.stringify({
        'forest-theme': { purchased: true, equipped: true, purchaseDate: 'x' },
        'speed-reading': { purchased: true, equipped: false, purchaseDate: 'x' },
        'alex-shoes': { purchased: true, equipped: false, purchaseDate: 'x' },
      }),
    );
    expect(refundRetiredItems()).toBe(300);
    expect(getCoins().totalCoins).toBe(300);
    expect(refundRetiredItems()).toBe(0);
    expect(isOwned('alex-shoes')).toBe(true);
    expect(JSON.parse(localStorage.getItem('purchased_items')!)).not.toHaveProperty('forest-theme');
  });
});
