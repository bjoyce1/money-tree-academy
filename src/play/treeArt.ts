/**
 * The Money Tree, drawn in code on a canvas (no image files).
 *
 * The tree is a fixed, seeded skeleton of branches. How much of it shows
 * depends on `size` (0 = a seed, 1 = full grown), so the same tree grows a
 * little every season. Green leaves are money the player planted; gold leaves
 * are growth the tree earned, so `gold` (0 to 1) turns that share of leaves
 * gold. Wind bends the branches; a storm blows leaves away.
 *
 * Palette: the cover's night sky and lamplight gold. The greens live only
 * here, in the art, never in the interface (DESIGN.md, The One Lamp Rule).
 */

const NIGHT = '#0b1224';
const TAU = Math.PI * 2;

type Branch = {
  parent: number;
  depth: number;
  rel: number; // angle relative to the parent, radians
  len: number; // in tree heights
  width: number; // base width, in tree heights
  attach: number; // where on the parent it starts (1 = tip)
  birth: number; // size at which it starts to grow
  curve: number; // sideways bow, in lengths
  phase: number;
  children: number[];
  // per-frame
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  angle: number;
  k: number;
  kids: number; // how far its most-grown child has come
};

type Leaf = {
  branch: number;
  u: number; // position along the branch
  dx: number; // offset from the branch, in tree heights
  dy: number;
  rot: number;
  scale: number;
  shade: number; // 0 dark .. 3 lit
  front: boolean;
  goldRank: number; // turns gold when the gold share passes this
  phase: number;
  early: boolean; // a young shoot's leaf: fades once the branch has children
};

type Flyer = { x: number; y: number; vx: number; vy: number; rot: number; spin: number; life: number; sprite: number; scale: number };

export type TreeArt = {
  resize(width: number, height: number, dpr: number): void;
  /** Draw one frame. `t` in seconds. */
  draw(t: number, state: { size: number; gold: number; wind: number; storm: number; glow: number }): void;
};

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

const BIRTH = [0, 0.09, 0.22, 0.36, 0.5, 0.63, 0.75];
const SPAN = 0.24;
const MAX_DEPTH = 6;

function buildSkeleton(rand: () => number) {
  const branches: Branch[] = [];
  const leaves: Leaf[] = [];
  const add = (parent: number, depth: number, rel: number, len: number, width: number, attach: number) => {
    const b: Branch = {
      parent,
      depth,
      rel,
      len,
      width,
      attach,
      birth: Math.max(0, BIRTH[depth] + (rand() - 0.5) * 0.07),
      curve: (rand() - 0.5) * 0.22,
      phase: rand() * TAU,
      children: [],
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 0,
      cx: 0,
      cy: 0,
      angle: 0,
      k: 0,
      kids: 0,
    };
    branches.push(b);
    const id = branches.length - 1;
    if (parent >= 0) branches[parent].children.push(id);
    return id;
  };

  const grow = (id: number, heading: number) => {
    const b = branches[id];
    if (b.depth >= MAX_DEPTH) return;
    const d = b.depth + 1;
    // The trunk splits into three limbs; limbs fork in two, sometimes with a side shoot.
    const forks = b.depth === 0 ? [-0.62, -0.04, 0.6] : [-(0.34 + rand() * 0.2), 0.3 + rand() * 0.22];
    for (const f of forks) {
      let rel = f + (rand() - 0.5) * 0.14;
      // Lean a little back toward the sky so the crown rounds over instead of drooping.
      const abs = heading + rel;
      rel += (-Math.PI / 2 - abs) * (b.depth === 0 ? 0.04 : 0.1);
      const len = b.len * (b.depth === 0 ? 0.78 : 0.74 + rand() * 0.1);
      const child = add(id, d, rel, len, b.width * (b.depth === 0 ? 0.62 : 0.66), 1);
      grow(child, heading + rel);
    }
    if (b.depth >= 1 && b.depth <= 4 && rand() < 0.45) {
      const side = rand() < 0.5 ? -1 : 1;
      const rel = side * (0.7 + rand() * 0.35);
      const child = add(id, d, rel, b.len * (0.5 + rand() * 0.15), b.width * 0.42, 0.45 + rand() * 0.3);
      grow(child, heading + rel);
    }
  };

  const trunk = add(-1, 0, 0, 0.27, 0.062, 1);
  grow(trunk, -Math.PI / 2);

  // Leaves: young shoots carry a few until they fork; twigs carry the crown.
  branches.forEach((b, id) => {
    const twig = b.depth >= 3;
    const tipCount = b.depth >= 6 ? 6 : b.depth === 5 ? 5 : b.depth === 4 ? 4 : twig ? 4 : 4;
    for (let i = 0; i < tipCount; i++) {
      const spread = b.depth >= 5 ? 0.06 : twig ? 0.05 : 0.03;
      const a = rand() * TAU;
      const r = (0.25 + 0.75 * Math.sqrt(rand())) * spread;
      leaves.push({
        branch: id,
        u: twig ? 0.3 + rand() * 0.8 : 0.92 + rand() * 0.12,
        dx: Math.cos(a) * r,
        dy: Math.sin(a) * r * 0.9,
        // Leaves point away from the middle of their cluster, like a real spray.
        rot: a + (rand() - 0.5) * 1.3,
        scale: 0.95 + rand() * 0.6,
        shade: 0,
        front: rand() < 0.6,
        goldRank: rand(),
        phase: rand() * TAU,
        early: !twig,
      });
    }
  });
  return { branches, leaves };
}

/** A pointed leaf, base at the left edge, drawn once per colour. */
function leafSprite(dpr: number, from: string, to: string, rib: string) {
  const w = Math.ceil(44 * dpr);
  const h = Math.ceil(24 * dpr);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  const grad = g.createLinearGradient(0, 0, 44, 0);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(1, 12);
  g.bezierCurveTo(10, 0.5, 30, 1.5, 43, 12);
  g.bezierCurveTo(30, 22.5, 10, 23.5, 1, 12);
  g.fill();
  g.strokeStyle = rib;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(3, 12);
  g.quadraticCurveTo(22, 10.5, 40, 12);
  g.stroke();
  return c;
}

function glowSprite(dpr: number, rgb: string) {
  const s = Math.ceil(64 * dpr);
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, `rgba(${rgb},0.5)`);
  grad.addColorStop(0.35, `rgba(${rgb},0.16)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

const GREENS: [string, string, string][] = [
  ['#0c2218', '#12301f', 'rgba(255,255,255,0.04)'],
  ['#12301f', '#1c4a2c', 'rgba(255,255,255,0.07)'],
  ['#1a4429', '#2c6b3b', 'rgba(255,255,255,0.1)'],
  ['#24593a', '#4a9450', 'rgba(255,255,255,0.16)'],
];
const GOLDS: [string, string, string][] = [
  ['#9c6f1f', '#dcab45', 'rgba(255,246,220,0.35)'],
  ['#c08f30', '#f0cc6e', 'rgba(255,250,235,0.5)'],
];

export function createTreeArt(canvas: HTMLCanvasElement, seed = 606): TreeArt {
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry(seed);
  const { branches, leaves } = buildSkeleton(rand);

  let W = 0;
  let H = 0;
  let DPR = 1;
  let sky: HTMLCanvasElement | null = null;
  let green: HTMLCanvasElement[] = [];
  let golden: HTMLCanvasElement[] = [];
  let glow: HTMLCanvasElement | null = null;
  const flyers: Flyer[] = [];
  const specks = Array.from({ length: 46 }, () => ({ b: Math.floor(rand() * 4), u: rand(), side: rand() - 0.5, phase: rand() * TAU }));
  let lastT = 0;

  // Where each leaf sits in the full-grown crown decides how much lamplight it catches.
  const shadeLeaves = () => {
    place(1, 0, 0, 1, 0, 0);
    let minY = Infinity;
    let maxY = -Infinity;
    const pos = leaves.map((l) => {
      const b = branches[l.branch];
      const y = b.y0 + (b.y1 - b.y0) * Math.min(1, l.u) + l.dy;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      return y;
    });
    leaves.forEach((l, i) => {
      const top = 1 - (pos[i] - minY) / Math.max(1e-6, maxY - minY); // 1 at the top of the crown
      const lit = top * 0.75 + (l.front ? 0.25 : 0) + (l.phase / TAU - 0.5) * 0.35;
      l.shade = l.front ? (lit > 0.86 ? 3 : lit > 0.52 ? 2 : 1) : lit > 0.75 ? 1 : 0;
    });
  };

  /** Work out where every branch is for this frame. Units: tree heights, origin at the trunk's foot. */
  function place(size: number, t: number, wind: number, scale: number, ox: number, oy: number) {
    const lengthScale = 0.44 + 0.56 * Math.pow(size, 0.9);
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      const p = b.parent >= 0 ? branches[b.parent] : null;
      const k = p ? smooth((size - b.birth) / SPAN) * Math.min(1, p.k * 1.4) : smooth(size / 0.12);
      b.k = k;
      b.kids = 0;
      if (p && k > p.kids) p.kids = k;
      const sway = Math.sin(t * (0.9 + b.depth * 0.22) + b.phase) * 0.014 * (b.depth + 1) * wind;
      const lean = wind * wind * 0.015 * (b.depth + 0.5);
      const base = p ? p.angle : -Math.PI / 2;
      b.angle = base + b.rel + sway + lean;
      if (p) {
        // A point part-way along the parent's bowed line.
        const u = b.attach;
        const a = 1 - u;
        b.x0 = a * a * p.x0 + 2 * a * u * p.cx + u * u * p.x1;
        b.y0 = a * a * p.y0 + 2 * a * u * p.cy + u * u * p.y1;
      } else {
        b.x0 = ox;
        b.y0 = oy;
      }
      const L = b.len * k * lengthScale * scale;
      b.x1 = b.x0 + Math.cos(b.angle) * L;
      b.y1 = b.y0 + Math.sin(b.angle) * L;
      const mx = (b.x0 + b.x1) / 2;
      const my = (b.y0 + b.y1) / 2;
      b.cx = mx + Math.cos(b.angle + Math.PI / 2) * b.curve * L;
      b.cy = my + Math.sin(b.angle + Math.PI / 2) * b.curve * L;
    }
  }

  function paintSky() {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * DPR);
    c.height = Math.ceil(H * DPR);
    const g = c.getContext('2d')!;
    g.scale(DPR, DPR);
    const r = mulberry(seed + 7);
    const horizon = H * (H < 360 ? 0.88 : 0.84);

    // A band of lighter night near the horizon; it returns to Night Sky at every edge.
    const band = g.createLinearGradient(0, H * 0.3, 0, horizon);
    band.addColorStop(0, 'rgba(21,33,74,0)');
    band.addColorStop(1, 'rgba(27,42,92,0.55)');
    g.fillStyle = band;
    g.fillRect(0, 0, W, horizon + 2);

    // Stars, sparse and small.
    const stars = Math.round((W * H) / 5200);
    for (let i = 0; i < stars; i++) {
      const x = r() * W;
      const y = r() * horizon * 0.8;
      const s = r() < 0.12 ? 1.3 : 0.7;
      g.fillStyle = `rgba(246,239,223,${0.18 + r() * 0.5})`;
      g.beginPath();
      g.arc(x, y, s, 0, TAU);
      g.fill();
    }

    // The city, far off: two rows of towers with a few lit windows.
    const towers = (count: number, minH: number, maxH: number, fill: string, lights: number) => {
      let x = -10;
      const step = (W + 20) / count;
      for (let i = 0; i < count; i++) {
        const w = step * (0.55 + r() * 0.4);
        const mid = Math.abs((x + w / 2) / W - 0.5) * 2; // 0 centre .. 1 edge
        const h = (minH + r() * (maxH - minH)) * H * (1 - mid * 0.35);
        g.fillStyle = fill;
        g.fillRect(x, horizon - h, w, h + 2);
        if (r() < 0.3) g.fillRect(x + w * 0.3, horizon - h - h * 0.12, w * 0.4, h * 0.12 + 1);
        if (r() < 0.14) g.fillRect(x + w * 0.48, horizon - h - h * 0.3, 1.2, h * 0.3);
        const n = Math.floor(lights * r() * (h / 30));
        for (let j = 0; j < n; j++) {
          g.fillStyle = `rgba(240,200,105,${0.25 + r() * 0.45})`;
          g.fillRect(x + 2 + r() * (w - 5), horizon - h + 3 + r() * (h - 8), 1.6, 1.6);
        }
        x += step;
      }
    };
    towers(Math.max(8, Math.round(W / 46)), 0.07, 0.2, '#111c3d', 2.2);
    towers(Math.max(7, Math.round(W / 60)), 0.04, 0.13, '#0e1731', 1.4);

    // Fade the sides and the foot of the city back into the one sky.
    const side = g.createLinearGradient(0, 0, W, 0);
    side.addColorStop(0, NIGHT);
    side.addColorStop(0.14, 'rgba(11,18,36,0)');
    side.addColorStop(0.86, 'rgba(11,18,36,0)');
    side.addColorStop(1, NIGHT);
    g.fillStyle = side;
    g.fillRect(0, 0, W, H);
    sky = c;
  }

  function resize(width: number, height: number, dpr: number) {
    W = Math.max(1, width);
    H = Math.max(1, height);
    DPR = Math.min(2, Math.max(1, dpr));
    canvas.width = Math.ceil(W * DPR);
    canvas.height = Math.ceil(H * DPR);
    green = GREENS.map((c) => leafSprite(DPR, c[0], c[1], c[2]));
    golden = GOLDS.map((c) => leafSprite(DPR, c[0], c[1], c[2]));
    glow = glowSprite(DPR, '240,200,105');
    paintSky();
  }

  function drawBranch(b: Branch, unit: number, size: number) {
    if (b.k <= 0.01) return;
    const thick = unit * (0.35 + 0.65 * size);
    const w0 = Math.max(0.6, b.width * thick * (b.depth === 0 ? 1 : Math.min(1, 0.35 + b.k)));
    const w1 = Math.max(0.5, w0 * (b.depth >= MAX_DEPTH ? 0.3 : 0.62));
    const N = b.depth <= 1 ? 8 : 4;
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const a = 1 - u;
      const x = a * a * b.x0 + 2 * a * u * b.cx + u * u * b.x1;
      const y = a * a * b.y0 + 2 * a * u * b.cy + u * u * b.y1;
      const tx = 2 * a * (b.cx - b.x0) + 2 * u * (b.x1 - b.cx);
      const ty = 2 * a * (b.cy - b.y0) + 2 * u * (b.y1 - b.cy);
      const m = Math.hypot(tx, ty) || 1;
      // The trunk flares where it meets the ground.
      const flare = b.depth === 0 ? 1 + 0.9 * Math.pow(1 - u, 4) : 1;
      const w = ((w0 + (w1 - w0) * u) * flare) / 2;
      left.push([x - (ty / m) * w, y + (tx / m) * w]);
      right.push([x + (ty / m) * w, y - (tx / m) * w]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = N; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    if (b.depth <= 2) {
      // Bark: dark on the left, lamplit on the right.
      const nx = Math.cos(b.angle + Math.PI / 2);
      const ny = Math.sin(b.angle + Math.PI / 2);
      const mx = (b.x0 + b.x1) / 2;
      const my = (b.y0 + b.y1) / 2;
      const g = ctx.createLinearGradient(mx + nx * w0 * 0.6, my + ny * w0 * 0.6, mx - nx * w0 * 0.6, my - ny * w0 * 0.6);
      g.addColorStop(0, '#170f0a');
      g.addColorStop(0.6, '#2f1f12');
      g.addColorStop(1, '#6b4a20');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = b.depth <= 4 ? '#2b1c10' : '#33230f';
    }
    ctx.fill();
  }

  // Scratch space for one pass over the leaves: x, y, scale, rotation, leaf index.
  const buf = new Float32Array(leaves.length * 5);

  function drawLeaves(front: boolean, t: number, unit: number, state: { size: number; gold: number; wind: number; storm: number }) {
    const leafLen = unit * 0.044;
    const spread = (0.45 + 0.55 * state.size) * unit;
    const lean = state.wind * state.wind * 0.35;
    const amp = 0.1 + 0.32 * state.wind;
    const base = (leafLen / 44) * (0.78 + 0.22 * state.size);
    const early = 2 - 0.8 * state.size;
    let n = 0;
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      if (l.front !== front) continue;
      const b = branches[l.branch];
      let vis = smooth((b.k - 0.12) / 0.45);
      // Shoot leaves give way once the branch has forked.
      if (l.early) vis *= 1 - smooth((b.kids - 0.3) / 0.5);
      if (vis <= 0.02) continue;
      const u = l.u > 1 ? 1 : l.u;
      const a = 1 - u;
      let x = a * a * b.x0 + 2 * a * u * b.cx + u * u * b.x1;
      let y = a * a * b.y0 + 2 * a * u * b.cy + u * u * b.y1;
      if (l.u > 1) {
        x += Math.cos(b.angle) * (l.u - 1) * b.len * unit * 0.5;
        y += Math.sin(b.angle) * (l.u - 1) * b.len * unit * 0.5;
      }
      const o = n * 5;
      buf[o] = x + l.dx * spread;
      buf[o + 1] = y + l.dy * spread;
      buf[o + 2] = base * l.scale * vis * (l.early ? early : 1);
      buf[o + 3] = l.rot + Math.sin(t * (1.6 + (l.phase % 1)) + l.phase) * amp + lean;
      buf[o + 4] = i;
      n++;
    }

    // The lamplight on gold leaves, all in one pass.
    if (front && glow && state.gold > 0) {
      const limit = state.gold * 0.4;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.24;
      for (let j = 0; j < n; j++) {
        const l = leaves[buf[j * 5 + 4]];
        if (l.goldRank >= limit) continue;
        const gs = leafLen * 2.3 * l.scale;
        ctx.drawImage(glow, buf[j * 5] - gs / 2, buf[j * 5 + 1] - gs / 2, gs, gs);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    for (let j = 0; j < n; j++) {
      const o = j * 5;
      const l = leaves[buf[o + 4]];
      const sc = buf[o + 2] * DPR;
      const cos = Math.cos(buf[o + 3]) * sc;
      const sin = Math.sin(buf[o + 3]) * sc;
      ctx.setTransform(cos, sin, -sin, cos, buf[o] * DPR, buf[o + 1] * DPR);
      ctx.drawImage(l.goldRank < state.gold ? golden[l.shade >= 2 ? 1 : 0] : green[l.shade], 0, -12, 44, 24);
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function draw(t: number, state: { size: number; gold: number; wind: number; storm: number; glow: number }) {
    if (!W || !sky) return;
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(sky, 0, 0, W, H);

    // A short scene (a phone) gives the tree nearly all of its height.
    const short = H < 360;
    const groundY = H * (short ? 0.9 : 0.86);
    const unit = Math.min(H * (short ? 0.78 : 0.7), W * 0.76); // one tree height, in pixels
    const ox = W / 2;
    const size = Math.max(0, Math.min(1, state.size));
    place(size, t, state.wind, unit, ox, groundY);

    // The crown's bounds, for the lamp behind it.
    let top = groundY;
    for (const b of branches) if (b.k > 0.05) top = Math.min(top, b.y1);
    const crownY = (top + groundY) / 2 - unit * 0.08 * size;
    const lamp = unit * (0.28 + 0.62 * size);
    const warm = (0.1 + 0.2 * size) * (0.75 + 0.5 * state.glow) * (1 - 0.5 * state.storm);
    const halo = ctx.createRadialGradient(ox, crownY, 0, ox, crownY, lamp);
    halo.addColorStop(0, `rgba(230,185,85,${warm})`);
    halo.addColorStop(0.5, `rgba(230,185,85,${warm * 0.32})`);
    halo.addColorStop(1, 'rgba(230,185,85,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // The ground: a low hill catching the lamp along its ridge.
    const rx = W * 0.95;
    const ry = H * 0.3;
    ctx.save();
    ctx.translate(ox, groundY + ry - 3);
    ctx.scale(1, ry / rx);
    const hill = ctx.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
    hill.addColorStop(0, NIGHT);
    hill.addColorStop(0.8, '#0d1a24');
    hill.addColorStop(0.965, '#12272a');
    hill.addColorStop(1, '#1d4034');
    ctx.fillStyle = hill;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
    // The ground runs out to the same sky at the sides and the foot.
    const fadeX = ctx.createLinearGradient(0, 0, W, 0);
    fadeX.addColorStop(0, NIGHT);
    fadeX.addColorStop(0.3, 'rgba(11,18,36,0)');
    fadeX.addColorStop(0.7, 'rgba(11,18,36,0)');
    fadeX.addColorStop(1, NIGHT);
    ctx.fillStyle = fadeX;
    ctx.fillRect(0, groundY - 8, W, H - groundY + 8);
    const fadeY = ctx.createLinearGradient(0, groundY + 6, 0, H);
    fadeY.addColorStop(0, 'rgba(11,18,36,0)');
    fadeY.addColorStop(0.85, NIGHT);
    ctx.fillStyle = fadeY;
    ctx.fillRect(0, groundY + 6, W, H - groundY - 6);
    const pool = ctx.createRadialGradient(ox, groundY + 4, 0, ox, groundY + 4, unit * (0.12 + 0.3 * size));
    pool.addColorStop(0, `rgba(230,185,85,${0.1 + 0.16 * size})`);
    pool.addColorStop(1, 'rgba(230,185,85,0)');
    ctx.fillStyle = pool;
    ctx.save();
    ctx.translate(ox, groundY + 4);
    ctx.scale(1, 0.22);
    ctx.translate(-ox, -(groundY + 4));
    ctx.fillRect(0, groundY - unit, W, unit * 2);
    ctx.restore();

    if (size <= 0.001) {
      // A seed, waiting.
      if (glow) {
        const gs = unit * 0.16 * (1 + 0.08 * Math.sin(t * 1.4));
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(glow, ox - gs / 2, groundY - gs / 2 - 2, gs, gs);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.fillStyle = '#e6b955';
      ctx.beginPath();
      ctx.ellipse(ox, groundY - 2, unit * 0.014, unit * 0.009, -0.4, 0, TAU);
      ctx.fill();
    } else {
      drawLeaves(false, t, unit, state);
      for (const b of branches) drawBranch(b, unit, size);

      // Gold dust in the bark, as on the cover.
      const thick = unit * (0.35 + 0.65 * size);
      for (const s of specks) {
        const b = branches[s.b];
        if (!b || b.k < 0.5) continue;
        const u = s.u;
        const a = 1 - u;
        const x = a * a * b.x0 + 2 * a * u * b.cx + u * u * b.x1;
        const y = a * a * b.y0 + 2 * a * u * b.cy + u * u * b.y1;
        const w = b.width * thick * 0.7;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + s.phase));
        ctx.fillStyle = `rgba(246,217,138,${0.5 * tw * size})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(b.angle + Math.PI / 2) * s.side * w, y + Math.sin(b.angle + Math.PI / 2) * s.side * w, Math.max(0.6, unit * 0.0022), 0, TAU);
        ctx.fill();
      }
      drawLeaves(true, t, unit, state);
    }

    // Grass at the trunk's foot, over the bark.
    ctx.strokeStyle = '#1f4631';
    ctx.lineWidth = Math.max(1, unit * 0.004);
    ctx.lineCap = 'round';
    const gr = mulberry(seed + 99);
    const blades = Math.round(10 + 22 * size);
    for (let i = 0; i < blades; i++) {
      const gx = ox + (gr() - 0.5) * unit * (0.16 + 0.4 * size);
      const gh = unit * (0.012 + gr() * 0.022);
      const bend = (gr() - 0.5) * gh + state.wind * gh * 0.6 * Math.sin(t * 2 + i);
      const gy = groundY + 2 + Math.abs(gx - ox) * 0.03;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + bend * 0.4, gy - gh * 0.6, gx + bend, gy - gh);
      ctx.stroke();
    }

    // A storm: rain, and leaves torn loose.
    if (state.storm > 0.02) {
      ctx.fillStyle = `rgba(11,18,36,${0.3 * state.storm})`;
      ctx.fillRect(0, 0, W, H);
      const rr = mulberry(Math.floor(t * 30) + 1);
      ctx.strokeStyle = `rgba(246,239,223,${0.2 * state.storm})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const drops = Math.round((W / 9) * state.storm);
      for (let i = 0; i < drops; i++) {
        const x = rr() * (W + 80) - 40;
        const y = rr() * H * 0.92;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 6, y + 15);
      }
      ctx.stroke();
      if (size > 0.05 && flyers.length < 60 && rr() < 0.55 * state.storm) {
        const l = leaves[Math.floor(rr() * leaves.length)];
        const b = branches[l.branch];
        if (b.k > 0.6) {
          flyers.push({
            x: b.x1,
            y: b.y1,
            vx: unit * (0.25 + rr() * 0.4),
            vy: -unit * 0.08 * rr(),
            rot: rr() * TAU,
            spin: (rr() - 0.5) * 8,
            life: 1,
            sprite: l.shade,
            scale: l.scale,
          });
        }
      }
    }
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i];
      f.life -= dt * 0.55;
      f.vy += unit * 0.55 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.spin * dt;
      if (f.life <= 0 || f.y > groundY + 10 || f.x > W + 30) {
        flyers.splice(i, 1);
        continue;
      }
      const s = ((unit * 0.05) / 44) * f.scale;
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.scale(s, s);
      ctx.drawImage(green[Math.min(3, f.sprite + 1)], 0, -12, 44, 24);
      ctx.restore();
    }
  }

  shadeLeaves();
  return { resize, draw };
}
