// Study tools: notes, bookmarks and highlights. Local-first: everything is
// saved in this browser straight away (the keys the app has always used),
// and copied to the reader's account when they are signed in.

import { useSyncExternalStore } from 'react';
import { bookmarksAPI, highlightsAPI, notesAPI } from './api';
import { recordActivity } from './rewards';
import type { Highlight } from '@/components/reader/highlights';

export type { Highlight };

export type Note = { id: string; chapterId: string; text: string; quote?: string; createdAt: number };

export type Bookmark = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  position: number; // percent down the chapter
  label: string;
  excerpt: string;
  createdAt: number;
  isFavorite?: boolean;
};

const NOTES = 'notes:local';
const BOOKMARKS = 'user_bookmarks';
const highlightsKey = (chapterId: string) => `highlights_${chapterId}`;
const CHANGED = 'study-changed';

function readList<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: unknown[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage blocked or full: kept for this visit only */
  }
  cache.clear();
  window.dispatchEvent(new Event(CHANGED));
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Signed-in readers also get a copy on the server; failures never block the reader. */
let syncToAccount = false;
export function setAccountSync(on: boolean) {
  syncToAccount = on;
}
const quietly = (p: Promise<unknown>) => p.catch(() => undefined);

// ------------------------------------------------------------------- notes

export const getNotes = (chapterId: string) => readList<Note>(NOTES).filter((n) => n.chapterId === chapterId);

export function addNote(chapterId: string, text: string, quote?: string) {
  const clean = text.trim();
  if (!clean) return;
  const note: Note = { id: newId(), chapterId, text: clean, quote, createdAt: Date.now() };
  writeList(NOTES, [...readList<Note>(NOTES), note]);
  recordActivity('note-created');
  if (syncToAccount) void quietly(notesAPI.create({ chapterId, text: clean, quote } as never));
}

export function deleteNote(id: string) {
  writeList(NOTES, readList<Note>(NOTES).filter((n) => n.id !== id));
  if (syncToAccount) void quietly(notesAPI.delete(id));
}

// --------------------------------------------------------------- bookmarks

export const getBookmarks = (chapterId?: string) =>
  readList<Bookmark>(BOOKMARKS).filter((b) => !chapterId || b.chapterId === chapterId);

export function addBookmark(b: Omit<Bookmark, 'id' | 'createdAt'>) {
  const bookmark: Bookmark = { ...b, id: newId(), createdAt: Date.now() };
  writeList(BOOKMARKS, [...readList<Bookmark>(BOOKMARKS), bookmark]);
  recordActivity('bookmark-created');
  if (syncToAccount)
    void quietly(bookmarksAPI.create({ chapterId: b.chapterId, position: b.position, label: b.label, excerpt: b.excerpt } as never));
  return bookmark;
}

export function deleteBookmark(id: string) {
  writeList(BOOKMARKS, readList<Bookmark>(BOOKMARKS).filter((b) => b.id !== id));
  if (syncToAccount) void quietly(bookmarksAPI.delete(id));
}

// -------------------------------------------------------------- highlights

export const getHighlights = (chapterId: string) =>
  readList<Highlight>(highlightsKey(chapterId)).sort((a, b) => a.startOffset - b.startOffset);

export function addHighlight(h: Omit<Highlight, 'id' | 'createdAt'>) {
  const highlight: Highlight = { ...h, id: newId(), createdAt: Date.now() };
  writeList(highlightsKey(h.chapterId), [...readList<Highlight>(highlightsKey(h.chapterId)), highlight]);
  recordActivity('text-highlighted');
  if (syncToAccount)
    void quietly(
      highlightsAPI.create({
        chapterId: h.chapterId,
        startOffset: h.startOffset,
        endOffset: h.endOffset,
        text: h.text,
        color: h.color,
        note: h.note,
      } as never),
    );
  return highlight;
}

export function deleteHighlight(chapterId: string, id: string) {
  writeList(highlightsKey(chapterId), readList<Highlight>(highlightsKey(chapterId)).filter((h) => h.id !== id));
  if (syncToAccount) void quietly(highlightsAPI.delete(id));
}

// ------------------------------------------------------------------- React

const cache = new Map<string, unknown>();

function subscribe(cb: () => void) {
  window.addEventListener(CHANGED, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener('storage', cb);
  };
}

function useCached<T>(key: string, load: () => T): T {
  const get = () => {
    if (!cache.has(key)) cache.set(key, load());
    return cache.get(key) as T;
  };
  return useSyncExternalStore(
    (cb) =>
      subscribe(() => {
        cache.delete(key);
        cb();
      }),
    get,
    get,
  );
}

export const useNotes = (chapterId: string) => useCached(`n:${chapterId}`, () => getNotes(chapterId));
export const useBookmarks = (chapterId?: string) => useCached(`b:${chapterId ?? '*'}`, () => getBookmarks(chapterId));
export const useHighlightsList = (chapterId: string) => useCached(`h:${chapterId}`, () => getHighlights(chapterId));
