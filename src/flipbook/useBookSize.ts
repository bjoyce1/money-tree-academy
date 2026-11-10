import { useEffect, useState, type RefObject } from "react";

/** Width / height of one PDF page (6 × 9 in trim). */
export const PAGE_ASPECT = 432 / 649.1622;

export interface BookSize {
  /** "spread" shows two pages; "single" pans a camera across one page. */
  mode: "spread" | "single";
  stageW: number;
  stageH: number;
  /** Hardcover board (covers). */
  boardW: number;
  boardH: number;
  /** Inner pages are inset from the board by `m` at top, bottom and fore-edge. */
  innerW: number;
  innerH: number;
  m: number;
  dpr: number;
}

function measure(w: number, h: number): BookSize {
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 3);
  const spread = w >= 820 && w / Math.max(h, 1) > 1.12;
  const padX = spread ? 96 : 14;
  const padY = spread ? 28 : 18;
  const availW = Math.max(w - padX * 2, 120);
  const availH = Math.max(h - padY * 2, 180);

  // Board aspect ≈ 0.661 once the page inset is added (see below).
  const boardAspect = 0.661;
  const boardH = Math.floor(Math.min(availH, (spread ? availW / 2 : availW) / boardAspect));
  const m = Math.max(4, Math.round(boardH * 0.014));
  const innerH = boardH - m * 2;
  const innerW = Math.round(innerH * PAGE_ASPECT);
  const boardW = innerW + m;

  return { mode: spread ? "spread" : "single", stageW: w, stageH: h, boardW, boardH, innerW, innerH, m, dpr };
}

export function useBookSize(ref: RefObject<HTMLElement | null>): BookSize | null {
  const [size, setSize] = useState<BookSize | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) => {
        const next = measure(r.width, r.height);
        if (
          prev &&
          prev.boardH === next.boardH &&
          prev.mode === next.mode &&
          prev.stageW === next.stageW &&
          prev.stageH === next.stageH &&
          prev.dpr === next.dpr
        )
          return prev;
        return next;
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}
