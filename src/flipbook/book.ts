import type { CSSProperties } from "react";
import pagesData from "./pages.json";

/**
 * The physical book.
 *
 * The PDF is 56 pages: p1 front cover, p2–p55 interior, p56 back cover.
 * Interior pages are numbered print-style (PDF p2 is printed "3", a recto),
 * so an endpaper is glued inside each cover. That gives 58 faces on 29 leaves
 * and puts every odd printed page on the right, like the real book.
 *
 *   seq index:  0      1          2 … 55        56          57
 *   face:       cover  endpaper   PDF p2 … p55  endpaper    back cover
 *
 * For interior pages, seq index === PDF page number, and printed number === seq + 1.
 */

export type Face =
  | { kind: "pdf"; n: number }
  | { kind: "endpaper"; variant: "front" | "back" };

export const PDF_PAGES: number = pagesData.pages;

export const SEQ: Face[] = [
  { kind: "pdf", n: 1 },
  { kind: "endpaper", variant: "front" },
  ...Array.from({ length: PDF_PAGES - 2 }, (_, i) => ({ kind: "pdf" as const, n: i + 2 })),
  { kind: "endpaper", variant: "back" },
  { kind: "pdf", n: PDF_PAGES },
];

export const TOTAL_PAGES = SEQ.length; // 58
export const LEAVES = TOTAL_PAGES / 2; // 29

export const leafFront = (i: number) => SEQ[2 * i];
export const leafBack = (i: number) => SEQ[2 * i + 1];
/** Hardcover boards don't bend. */
export const isRigid = (i: number) => i === 0 || i === LEAVES - 1;

/**
 * A "spread" is how many leaves have been turned (0 = closed on the front
 * cover, LEAVES = closed on the back cover). Spread t shows seq 2t-1 on the
 * left and seq 2t on the right.
 */
export const spreadForSeq = (s: number) => Math.floor((s + 1) / 2);
export const sideForSeq = (s: number): "left" | "right" => (s % 2 === 1 ? "left" : "right");

// Chapter openers live in chapters.ts so other routes can import them without
// the page-text JSON. PDF page n === seq n.
import { CHAPTERS, type Chapter } from "./chapters";
export { CHAPTERS, type Chapter };

export function chapterForSeq(s: number): Chapter {
  let found = CHAPTERS[0];
  for (const c of CHAPTERS) if (c.seq <= s) found = c;
  return found;
}

/* ---------------------------------------------------------------- images */

export type Tier = "hd" | "md";
const BASE = "/flipbook/pages";
export const pageImage = (n: number, tier: Tier) => `${BASE}/${String(n).padStart(3, "0")}-${tier}.webp`;
export const SPRITE_URL = `${BASE}/sprite.webp`;
export const SPRITE = {
  cols: pagesData.spriteCols,
  rows: pagesData.spriteRows,
};

export function textForFace(f: Face): string {
  if (f.kind === "endpaper") return f.variant === "front" ? "Inside front cover." : "Inside back cover.";
  return pagesData.texts[f.n - 1]?.text || (f.n === 1 ? "Front cover." : "Back cover.");
}

/**
 * Background layers for a face (or one vertical slice of it, while a page
 * bends). Two layers: the full-quality page on top once it's in the load
 * window, and the thumbnail sprite underneath as an instant placeholder.
 * Pixel maths keeps slices of both layers aligned.
 */
export function faceBackground(
  n: number,
  faceW: number,
  faceH: number,
  opts: { tier: Tier | null; slices?: number; slice?: number }
): CSSProperties {
  const slices = opts.slices ?? 1;
  const slice = opts.slice ?? 0;
  const sw = faceW / slices;
  const col = (n - 1) % SPRITE.cols;
  const row = Math.floor((n - 1) / SPRITE.cols);

  const sprite = {
    image: `url(${SPRITE_URL})`,
    size: `${SPRITE.cols * faceW}px ${SPRITE.rows * faceH}px`,
    pos: `${-(col * faceW + slice * sw)}px ${-row * faceH}px`,
  };
  if (!opts.tier) {
    return { backgroundImage: sprite.image, backgroundSize: sprite.size, backgroundPosition: sprite.pos };
  }
  return {
    backgroundImage: `url(${pageImage(n, opts.tier)}), ${sprite.image}`,
    backgroundSize: `${faceW}px ${faceH}px, ${sprite.size}`,
    backgroundPosition: `${-slice * sw}px 0px, ${sprite.pos}`,
  };
}
