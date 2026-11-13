import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { createTreeArt } from './treeArt';

export type SceneWeather = 'calm' | 'sun' | 'storm';

/**
 * The living tree behind the game. It eases toward the size and gold share it
 * is given, so every change in the Grow money is something you watch happen.
 * The canvas is decoration: the game says the same things in words.
 */
export function TreeScene({ size, gold, weather, className }: { size: number; gold: number; weather: SceneWeather; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef({ size, gold, weather });
  target.current = { size, gold, weather };
  const still = useReducedMotion();
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const art = createTreeArt(canvas);
    const shown = { size: target.current.size, gold: target.current.gold, wind: 0.25, storm: 0, glow: 0 };
    let raf = 0;
    let last = performance.now();
    let visible = true;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      art.resize(r.width, r.height, window.devicePixelRatio || 1);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = target.current;
      // Ease toward the target; growth is slow enough to watch.
      const ease = (rate: number) => 1 - Math.exp(-dt * rate);
      shown.size += (t.size - shown.size) * ease(1.5);
      shown.gold += (t.gold - shown.gold) * ease(1.2);
      shown.wind += ((t.weather === 'storm' ? 1 : t.weather === 'sun' ? 0.32 : 0.22) - shown.wind) * ease(1.6);
      shown.storm += ((t.weather === 'storm' ? 1 : 0) - shown.storm) * ease(2.2);
      shown.glow += ((t.weather === 'sun' ? 1 : 0) - shown.glow) * ease(1.6);
      art.draw(now / 1000, shown);
      if (visible) raf = requestAnimationFrame(frame);
    };

    const drawStill = () => {
      const t = target.current;
      art.draw(0, { size: t.size, gold: t.gold, wind: 0, storm: 0, glow: t.weather === 'sun' ? 1 : 0 });
    };
    redraw.current = still ? drawStill : () => {};

    fit();
    const ro = new ResizeObserver(() => {
      fit();
      if (still) drawStill();
    });
    ro.observe(canvas);

    const onVisible = () => {
      visible = document.visibilityState === 'visible';
      cancelAnimationFrame(raf);
      if (visible && !still) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    if (still) drawStill();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [still]);

  // With reduced motion there is no loop: draw once whenever something changes.
  useEffect(() => {
    redraw.current();
  }, [size, gold, weather]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
