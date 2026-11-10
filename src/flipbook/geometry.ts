/**
 * Page-turn geometry and lighting. Pure functions of progress so they can run
 * inside Motion's per-frame `useTransform` callbacks without allocating.
 *
 * Progress p: 0 = leaf lying flat on the right stack, 1 = flat on the left.
 * Angles are rotateY in degrees: 0 = flat right, -180 = flat left.
 */

const D2R = Math.PI / 180;

/** Higher = more curl mid-turn. 1.55 gives ~50° of bend across the page at p = 0.5. */
const CURL = 1.55;

/** Direction the page is travelling: 1 = forward (right → left), -1 = back. */
export type Dir = 1 | -1;

/**
 * Angle of the spine-side strip. The edge being pulled leads and the spine
 * side follows, so the paper arcs toward the reader and flattens as it lands.
 */
export function spineAngle(p: number, dir: Dir, rigid: boolean): number {
  if (rigid) return -180 * p;
  const lag = Math.pow(p, CURL);
  const lead = 1 - Math.pow(1 - p, CURL);
  return -180 * (dir === 1 ? lag : lead);
}

export function edgeAngle(p: number, dir: Dir, rigid: boolean): number {
  if (rigid) return -180 * p;
  const lag = Math.pow(p, CURL);
  const lead = 1 - Math.pow(1 - p, CURL);
  return -180 * (dir === 1 ? lead : lag);
}

/** Absolute angle of strip k of n (uniform curvature → a smooth arc). */
export function stripAngle(p: number, dir: Dir, rigid: boolean, k: number, n: number): number {
  const s = spineAngle(p, dir, rigid);
  if (n === 1) return s;
  return s + ((edgeAngle(p, dir, rigid) - s) * k) / (n - 1);
}

/**
 * Angle at the boundary between strips (vertex j sits at the left edge of
 * strip j, j = 0..n). Shading interpolates between a strip's two vertices so
 * neighbouring strips meet exactly: smooth (Gouraud) shading, no banding.
 */
export function vertexAngle(p: number, dir: Dir, rigid: boolean, j: number, n: number): number {
  const s = spineAngle(p, dir, rigid);
  if (n === 1) return s;
  const a = s + ((edgeAngle(p, dir, rigid) - s) * (j - 0.5)) / (n - 1);
  return Math.min(0, Math.max(-180, a));
}

/** Rotation of strip k relative to its parent strip. */
export function stripRelative(p: number, dir: Dir, rigid: boolean, k: number, n: number): number {
  if (k === 0) return spineAngle(p, dir, rigid);
  return (edgeAngle(p, dir, rigid) - spineAngle(p, dir, rigid)) / (n - 1);
}

/* --------------------------------------------------------------- lighting */
// Light sits in front of the book, a little to the upper left.

/** Darkness of a front face turned away from the reader (0 = fully lit). */
export function frontShade(theta: number): number {
  return Math.min(0.72, 0.6 * (1 - Math.cos(theta * D2R)));
}

/** Darkness of a back face (it faces the reader once theta passes -90). */
export function backShade(theta: number): number {
  return Math.min(0.72, 0.6 * (1 + Math.cos(theta * D2R)));
}

/** Specular glint that travels across the paper as it curls. */
export function frontGloss(theta: number): number {
  const d = (theta + 40) / 20;
  return 0.22 * Math.exp(-d * d);
}

export function backGloss(theta: number): number {
  const d = (theta + 140) / 20;
  return 0.22 * Math.exp(-d * d);
}

/* ----------------------------------------------------------- cast shadow */

/**
 * Horizontal position of the leaf's free edge, as a fraction of page width
 * from the spine (1 = resting on the right, -1 = resting on the left).
 * Mean of cos over the arc, in closed form.
 */
export function edgeProjection(p: number, dir: Dir, rigid: boolean): number {
  const s = spineAngle(p, dir, rigid) * D2R;
  const e = edgeAngle(p, dir, rigid) * D2R;
  if (Math.abs(e - s) < 1e-4) return Math.cos(s);
  return (Math.sin(e) - Math.sin(s)) / (e - s);
}

/** How strongly a lifted page darkens the page beneath it. */
export function liftShadow(p: number): number {
  return Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
}
