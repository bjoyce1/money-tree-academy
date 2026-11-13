import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { createMarketArt, type MarketArt, type MarketState, type WalkOutcome } from './marketArt';

export type MarketSceneHandle = {
  /** Send one person up to the stall; `onArrive` fires as they reach the table. */
  send(outcome: WalkOutcome, onArrive?: () => void): void;
  /** Clear everyone off the stage (when a day is skipped). */
  clear(): void;
};

/**
 * The market behind the game. The canvas is decoration: the game says the
 * same things in words. With reduced motion nobody walks; `send` answers at
 * once and the scene is drawn still.
 */
export const MarketScene = forwardRef<MarketSceneHandle, MarketState & { className?: string }>(function MarketScene(
  { className, ...state },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const art = useRef<MarketArt | null>(null);
  const latest = useRef(state);
  latest.current = state;
  const still = useReducedMotion();
  const redraw = useRef<() => void>(() => {});

  useImperativeHandle(
    ref,
    () => ({
      send(outcome, onArrive) {
        if (still || !art.current) onArrive?.();
        else art.current.send(outcome, onArrive);
      },
      clear() {
        art.current?.clear();
      },
    }),
    [still],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = createMarketArt(canvas);
    art.current = a;
    let raf = 0;
    let visible = true;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      a.resize(r.width, r.height, window.devicePixelRatio || 1);
    };
    const frame = (now: number) => {
      a.draw(now / 1000, latest.current);
      if (visible) raf = requestAnimationFrame(frame);
    };
    const drawStill = () => a.draw(0, latest.current);
    redraw.current = still ? drawStill : () => {};

    fit();
    const ro = new ResizeObserver(() => {
      fit();
      if (still) drawStill();
    });
    ro.observe(canvas);
    // The stall's name is set in the book's display face; draw again once it has loaded.
    void document.fonts?.ready.then(() => still && drawStill());

    const onVisible = () => {
      visible = document.visibilityState === 'visible';
      cancelAnimationFrame(raf);
      if (visible && !still) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisible);

    if (still) drawStill();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
      art.current = null;
    };
  }, [still]);

  useEffect(() => {
    redraw.current();
  }, [state.price, state.stock, state.jar, state.sign, state.sample, state.crowd, state.guest]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
});
