/**
 * Small pieces of drawn art shared by the home page scenes. Flat shapes in
 * the book's colours: no gradients, no glows.
 */

/** The golden leaf Renee and Alex follow: a lit half, a shaded half, a midrib and veins. */
export function GoldLeaf({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden focusable="false">
      <path d="M5 35C5 18 15 6 35 5c0 19-11 30-30 30Z" fill="#e6b955" />
      <path d="M5 35C14 26 23 16 35 5c0 19-11 30-30 30Z" fill="#c4902f" />
      <path d="M5 35C13 26 22 16 33 7" stroke="#7f5310" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path
        d="M12 27l-1-7M17 22l-.5-7.5M22 17l.5-6M15 25l6 1M20 20l7 .5M25 15l6-.5"
        stroke="#7f5310"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/** A tiny seeded random, so the skyline is the same on every visit. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tower = { x: number; w: number; h: number; cap: number; windows: { x: number; y: number }[] };

function towers(seed: number, count: number, minH: number, maxH: number, lit: number): Tower[] {
  const r = seeded(seed);
  const out: Tower[] = [];
  let x = -10;
  const step = 1210 / count;
  for (let i = 0; i < count; i++) {
    const w = step * (0.62 + r() * 0.36);
    const h = minH + r() * (maxH - minH);
    const windows: { x: number; y: number }[] = [];
    const cols = Math.max(2, Math.floor(w / 9));
    const rows = Math.floor(h / 11);
    for (let row = 1; row < rows; row++)
      for (let col = 0; col < cols; col++) if (r() < lit) windows.push({ x: x + 4 + col * ((w - 8) / cols), y: 200 - h + row * 11 });
    out.push({ x, w, h, cap: r() < 0.28 ? 6 + r() * 12 : 0, windows });
    x += step;
  }
  return out;
}

const FAR = towers(7, 26, 40, 120, 0.05);
const NEAR = towers(19, 17, 22, 78, 0.09);

/**
 * Houston at night, along the bottom of the opening: two rows of towers with a
 * few lit windows. It sits behind the book as the far plane.
 */
export function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden focusable="false">
      <g fill="#111b3c">
        {FAR.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={200 - t.h} width={t.w} height={t.h} />
            {t.cap > 0 && <rect x={t.x + t.w * 0.3} y={200 - t.h - t.cap} width={t.w * 0.4} height={t.cap} />}
          </g>
        ))}
      </g>
      <g fill="#e6b955" opacity="0.32">
        {FAR.flatMap((t, i) => t.windows.map((w, j) => <rect key={`${i}-${j}`} x={w.x} y={w.y} width="2.4" height="3.2" />))}
      </g>
      <g fill="#16224a">
        {NEAR.map((t, i) => (
          <rect key={i} x={t.x} y={200 - t.h} width={t.w} height={t.h} />
        ))}
      </g>
      <g fill="#e6b955" opacity="0.5">
        {NEAR.flatMap((t, i) => t.windows.map((w, j) => <rect key={`${i}-${j}`} x={w.x} y={w.y + 2} width="2.6" height="3.4" />))}
      </g>
    </svg>
  );
}

/** The repeating leaf pattern printed inside the book's hard cover. */
export const ENDPAPER_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23d4a843' stroke-opacity='.32' stroke-width='1'%3E%3Cpath d='M14 6c-5 4-7 9-5 14 4-1 7-5 7-10 0-1.5-.6-3-2-4z'/%3E%3Cpath d='M9 20 15 9'/%3E%3Cpath d='M42 34c-5 4-7 9-5 14 4-1 7-5 7-10 0-1.5-.6-3-2-4z'/%3E%3Cpath d='M37 48l6-11'/%3E%3C/g%3E%3Cg fill='%23d4a843' fill-opacity='.22'%3E%3Ccircle cx='42' cy='12' r='1.4'/%3E%3Ccircle cx='14' cy='40' r='1.4'/%3E%3C/g%3E%3C/svg%3E\")";
