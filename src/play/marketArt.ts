/**
 * The Youth Market at night, drawn in code on a canvas (no image files).
 *
 * A stall under a striped awning: Fun Packs on the table, a price card, a
 * coin jar. People walk up from the right, decide, and walk away with a pack
 * or without one. Everything shown here is also said in words by the game.
 *
 * Palette: the cover's night sky and lamplight gold. Other colours live only
 * in the art (DESIGN.md, The One Lamp Rule).
 */

const NIGHT = '#0b1224';
const TAU = Math.PI * 2;
const PAPER = '#f3e6c4';
const INK = '#2a1d0a';

export type WalkOutcome = 'buy' | 'pricey' | 'soldout';

export type MarketState = {
  price: number; // dollars
  stock: number; // packs on the table
  jar: number; // 0 to 1, how full the coin jar is
  sign: boolean;
  sample: boolean;
  crowd: number; // 0 to 1, how many people drift by in the distance
  guest?: boolean; // a younger boy waiting at the table
};

export type MarketArt = {
  resize(width: number, height: number, dpr: number): void;
  draw(t: number, state: MarketState): void;
  /** Send one person up to the stall. `onArrive` fires as they reach the table. */
  send(outcome: WalkOutcome, onArrive?: () => void): void;
  clear(): void;
};

type Walker = {
  x: number;
  stop: number; // 0..1 offset of where they stand
  state: 'in' | 'at' | 'out';
  clock: number;
  outcome: WalkOutcome;
  onArrive?: () => void;
  arrived: boolean;
  tall: number; // height, in stall widths
  coat: string;
  skin: string;
  hair: number;
  phase: number;
  line: string;
};

type Drifter = { x: number; dir: number; speed: number; tall: number; phase: number };
type Coin = { x0: number; y0: number; clock: number };

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

const COATS = ['#2c3d74', '#3a2f62', '#5b3a26', '#24504c', '#6a4a1f', '#4a2c3e', '#3d4a6b'];
const SKINS = ['#5a3a25', '#7a5236', '#3f2a1c', '#8d6a4a', '#6b4630'];
const SAY: Record<WalkOutcome, string[]> = {
  buy: ['Yes, please!', 'One, please.', 'I’ll take one.', 'Perfect.'],
  pricey: ['Too much.', 'Not today.', 'Hmm, no.'],
  soldout: ['Sold out?', 'None left?'],
};

function glowSprite(dpr: number) {
  const s = Math.ceil(64 * dpr);
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(246,217,138,0.75)');
  grad.addColorStop(0.3, 'rgba(240,200,105,0.22)');
  grad.addColorStop(1, 'rgba(240,200,105,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export function createMarketArt(canvas: HTMLCanvasElement, seed = 11): MarketArt {
  const ctx = canvas.getContext('2d')!;
  let W = 0;
  let H = 0;
  let DPR = 1;
  let back: HTMLCanvasElement | null = null;
  let glow: HTMLCanvasElement | null = null;
  let bulbs: { x: number; y: number; phase: number }[] = [];
  const walkers: Walker[] = [];
  const drifters: Drifter[] = [];
  const coins: Coin[] = [];
  const rand = mulberry(seed);
  let lastT = 0;
  let sent = 0;

  // Where things stand. All set in layout().
  let groundY = 0;
  let s = 0; // the stall's width: every size in the scene is a share of it
  let sx = 0; // the stall's left edge
  let tableY = 0;
  let counterX = 0;

  function layout() {
    const short = H < 360;
    groundY = H * (short ? 0.83 : 0.8);
    s = Math.min(W * 0.44, H * (short ? 0.68 : 0.58), 460);
    sx = Math.max(W * 0.05, W * 0.3 - s / 2);
    tableY = groundY - s * 0.36;
    counterX = sx + s * 1.16;
  }

  function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function paintBack() {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * DPR);
    c.height = Math.ceil(H * DPR);
    const g = c.getContext('2d')!;
    g.scale(DPR, DPR);
    const r = mulberry(seed + 5);

    // Stars above, and the warm haze a lit market throws up into the night.
    const stars = Math.round((W * H) / 6500);
    for (let i = 0; i < stars; i++) {
      g.fillStyle = `rgba(246,239,223,${0.15 + r() * 0.45})`;
      g.beginPath();
      g.arc(r() * W, r() * groundY * 0.6, r() < 0.12 ? 1.2 : 0.7, 0, TAU);
      g.fill();
    }
    const haze = g.createLinearGradient(0, groundY - H * 0.5, 0, groundY);
    haze.addColorStop(0, 'rgba(230,185,85,0)');
    haze.addColorStop(1, 'rgba(230,185,85,0.1)');
    g.fillStyle = haze;
    g.fillRect(0, groundY - H * 0.5, W, H * 0.5);

    // Trees behind the market, then the far booths with their lamps.
    for (let i = 0; i < 7; i++) {
      const x = (i + 0.2 + r() * 0.6) * (W / 7);
      const rad = s * (0.22 + r() * 0.16);
      g.fillStyle = '#0d1630';
      g.beginPath();
      g.arc(x, groundY - s * 0.5 - r() * s * 0.12, rad, 0, TAU);
      g.arc(x + rad * 0.7, groundY - s * 0.42, rad * 0.8, 0, TAU);
      g.fill();
      g.fillRect(x - s * 0.012, groundY - s * 0.5, s * 0.024, s * 0.5);
    }
    const booths = Math.max(3, Math.round(W / (s * 0.75)));
    for (let i = 0; i < booths; i++) {
      const w = s * (0.36 + r() * 0.14);
      const x = (i + 0.15 + r() * 0.3) * (W / booths);
      const top = groundY - s * (0.34 + r() * 0.08);
      g.fillStyle = i % 2 ? '#131f45' : '#16234d';
      g.beginPath();
      g.moveTo(x - w * 0.06, top + s * 0.1);
      g.lineTo(x + w / 2, top);
      g.lineTo(x + w * 1.06, top + s * 0.1);
      g.closePath();
      g.fill();
      g.fillStyle = '#0e1836';
      g.fillRect(x, top + s * 0.1, w, groundY - top);
      const lamp = g.createRadialGradient(x + w / 2, top + s * 0.16, 0, x + w / 2, top + s * 0.16, w * 0.6);
      lamp.addColorStop(0, 'rgba(240,200,105,0.22)');
      lamp.addColorStop(1, 'rgba(240,200,105,0)');
      g.fillStyle = lamp;
      g.fillRect(x, top + s * 0.1, w, groundY - top - s * 0.1);
      g.fillStyle = '#16234d';
      g.fillRect(x + w * 0.08, groundY - s * 0.13, w * 0.84, s * 0.13);
    }

    // String lights from pole to pole across the market.
    bulbs = [];
    for (let k = 0; k < 2; k++) {
      const y0 = groundY - s * (1.16 + k * 0.1) - r() * s * 0.04;
      const y1 = groundY - s * (1.1 + k * 0.14) - r() * s * 0.04;
      const sag = s * (0.1 + r() * 0.05);
      g.strokeStyle = 'rgba(246,239,223,0.2)';
      g.lineWidth = 1;
      g.beginPath();
      const n = Math.max(8, Math.round(W / 34));
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = -10 + u * (W + 20);
        const y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI * (2 + k)) * sag * 0.6 + 4 * sag * u * (1 - u);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
        if (i > 0 && i < n) bulbs.push({ x, y: y + 2, phase: r() * TAU });
      }
      g.stroke();
    }

    if (groundY - s * 1.3 > 90) {
      const peak = { x: sx + s / 2, y: groundY - s * 1.02 };
      for (const from of [{ x: -10, y: groundY - s * 1.95 }, { x: W + 10, y: groundY - s * 1.75 }]) {
        g.strokeStyle = 'rgba(246,239,223,0.2)';
        g.lineWidth = 1;
        g.beginPath();
        const n = Math.max(6, Math.round(Math.abs(from.x - peak.x) / 36));
        for (let i = 0; i <= n; i++) {
          const u = i / n;
          const x = from.x + (peak.x - from.x) * u;
          const y = from.y + (peak.y - from.y) * u + 4 * s * 0.12 * u * (1 - u);
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
          if (i > 0 && i < n) bulbs.push({ x, y: y + 2, phase: r() * TAU });
        }
        g.stroke();
      }
    }

    // The lawn, lit where the stall's lamp falls, running out to the sky at the edges.
    const lawn = g.createLinearGradient(0, groundY, 0, H);
    lawn.addColorStop(0, '#14302a');
    lawn.addColorStop(0.35, '#0f2226');
    lawn.addColorStop(1, NIGHT);
    g.fillStyle = lawn;
    g.fillRect(0, groundY, W, H - groundY);
    g.save();
    g.translate(sx + s * 0.75, groundY + s * 0.06);
    g.scale(1, 0.2);
    const pool = g.createRadialGradient(0, 0, 0, 0, 0, s * 1.15);
    pool.addColorStop(0, 'rgba(240,200,105,0.3)');
    pool.addColorStop(1, 'rgba(240,200,105,0)');
    g.fillStyle = pool;
    g.beginPath();
    g.arc(0, 0, s * 1.15, 0, TAU);
    g.fill();
    g.restore();
    const side = g.createLinearGradient(0, 0, W, 0);
    side.addColorStop(0, NIGHT);
    side.addColorStop(0.1, 'rgba(11,18,36,0)');
    side.addColorStop(0.9, 'rgba(11,18,36,0)');
    side.addColorStop(1, NIGHT);
    g.fillStyle = side;
    g.fillRect(0, 0, W, H);
    back = c;
  }

  function resize(width: number, height: number, dpr: number) {
    W = Math.max(1, width);
    H = Math.max(1, height);
    DPR = Math.min(2, Math.max(1, dpr));
    canvas.width = Math.ceil(W * DPR);
    canvas.height = Math.ceil(H * DPR);
    layout();
    glow = glowSprite(DPR);
    paintBack();
    drifters.length = 0;
    const r = mulberry(seed + 31);
    for (let i = 0; i < 6; i++) {
      drifters.push({ x: r() * W, dir: r() < 0.5 ? -1 : 1, speed: 0.1 + r() * 0.1, tall: 0.2 + r() * 0.06, phase: r() * TAU });
    }
  }

  /** A person, feet at (x, y), `h` tall, facing left when `left`. */
  function person(x: number, y: number, h: number, coat: string, skin: string, hair: number, step: number, left: boolean, carrying: boolean, lit: boolean) {
    const head = h * 0.105;
    const top = y - h;
    const shoulder = top + head * 2.25;
    const hip = y - h * 0.4;
    const bw = h * 0.27;
    const swing = Math.sin(step) * h * 0.09;

    // legs
    ctx.strokeStyle = '#0d1530';
    ctx.lineWidth = h * 0.085;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - bw * 0.2, hip);
    ctx.lineTo(x - bw * 0.2 + swing, y - h * 0.02);
    ctx.moveTo(x + bw * 0.2, hip);
    ctx.lineTo(x + bw * 0.2 - swing, y - h * 0.02);
    ctx.stroke();

    // coat
    ctx.fillStyle = coat;
    roundRect(ctx, x - bw / 2, shoulder, bw, hip - shoulder + h * 0.05, bw * 0.42);
    ctx.fill();

    // arm, reaching forward when carrying a pack
    const dir = left ? -1 : 1;
    ctx.strokeStyle = coat;
    ctx.lineWidth = h * 0.07;
    ctx.beginPath();
    ctx.moveTo(x, shoulder + h * 0.05);
    if (carrying) ctx.lineTo(x + dir * bw * 0.75, shoulder + h * 0.17);
    else ctx.lineTo(x - swing * 0.9, shoulder + h * 0.25);
    ctx.stroke();
    if (carrying) {
      const px = x + dir * bw * 0.8;
      const py = shoulder + h * 0.07;
      ctx.fillStyle = PAPER;
      roundRect(ctx, px - h * 0.055, py, h * 0.11, h * 0.14, 1.5);
      ctx.fill();
      ctx.fillStyle = '#2c6b3b';
      ctx.beginPath();
      ctx.arc(px, py + h * 0.055, h * 0.03, 0, TAU);
      ctx.fill();
    }

    // head and hair
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, top + head, head, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#17100b';
    ctx.beginPath();
    if (hair === 0) ctx.arc(x, top + head * 0.82, head * 1.04, Math.PI, TAU);
    else if (hair === 1) ctx.arc(x, top + head * 0.55, head * 1.25, 0, TAU);
    else {
      ctx.arc(x, top + head * 0.85, head * 1.06, Math.PI * 0.95, TAU * 1.02);
      ctx.arc(x - dir * head * 0.2, top - head * 0.25, head * 0.62, 0, TAU);
    }
    ctx.fill();
    if (hair === 1) {
      // the face shows under a round crown of hair
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(x, top + head * 1.12, head * 0.92, 0, TAU);
      ctx.fill();
    }

    // lamplight along the side that faces the stall
    if (lit) {
      ctx.strokeStyle = 'rgba(246,217,138,0.55)';
      ctx.lineWidth = Math.max(1, h * 0.012);
      ctx.beginPath();
      ctx.arc(x, top + head * 1.05, head * 0.98, Math.PI * 0.72, Math.PI * 1.22);
      ctx.moveTo(x - bw / 2 + 0.5, shoulder + bw * 0.4);
      ctx.lineTo(x - bw / 2 + 0.5, hip);
      ctx.stroke();
    }
  }

  function bubble(x: number, y: number, text: string, good: boolean, alpha: number) {
    const size = Math.max(11, Math.min(17, s * 0.052));
    ctx.font = `700 ${size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
    const w = ctx.measureText(text).width + size * 1.3;
    const h = size * 1.9;
    const bx = Math.max(4, Math.min(W - w - 4, x - w / 2));
    const by = Math.max(4, y - h - size * 0.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = good ? '#f6efdf' : '#15214a';
    roundRect(ctx, bx, by, w, h, h / 2);
    ctx.fill();
    if (!good) {
      ctx.strokeStyle = 'rgba(230,185,85,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, by + h - 1);
    ctx.lineTo(x, by + h + size * 0.38);
    ctx.lineTo(x + size * 0.3, by + h - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = good ? NIGHT : 'rgba(246,239,223,0.86)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
    ctx.globalAlpha = 1;
  }

  function stall(t: number, st: MarketState) {
    const canopyTop = groundY - s * 0.98;
    const canopyH = s * 0.15;
    const over = s * 0.07;

    // the lamp under the awning, and the dark back of the booth
    ctx.fillStyle = '#0e1733';
    ctx.fillRect(sx + s * 0.03, canopyTop + canopyH, s * 0.94, tableY - canopyTop - canopyH);
    const lamp = ctx.createRadialGradient(sx + s / 2, canopyTop + canopyH + s * 0.08, 0, sx + s / 2, canopyTop + canopyH + s * 0.08, s * 0.75);
    lamp.addColorStop(0, 'rgba(240,200,105,0.4)');
    lamp.addColorStop(0.5, 'rgba(240,200,105,0.1)');
    lamp.addColorStop(1, 'rgba(240,200,105,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(sx - s * 0.4, canopyTop, s * 1.8, s * 1.1);

    // poles
    for (const px of [sx + s * 0.03, sx + s * 0.955]) {
      ctx.fillStyle = '#2a1b10';
      ctx.fillRect(px, canopyTop + canopyH * 0.5, s * 0.02, groundY - canopyTop - canopyH * 0.5);
      ctx.fillStyle = 'rgba(246,217,138,0.35)';
      ctx.fillRect(px + s * 0.014, canopyTop + canopyH, s * 0.004, groundY - canopyTop - canopyH);
    }

    // awning: navy and paper stripes, with a scalloped edge
    const stripes = 9;
    const sw = (s + over * 2) / stripes;
    for (let i = 0; i < stripes; i++) {
      const x = sx - over + i * sw;
      ctx.fillStyle = i % 2 ? PAPER : '#1e2f66';
      ctx.fillRect(x, canopyTop, sw + 0.5, canopyH);
      ctx.beginPath();
      ctx.arc(x + sw / 2, canopyTop + canopyH, sw / 2, 0, Math.PI);
      ctx.fill();
    }
    const shade = ctx.createLinearGradient(0, canopyTop, 0, canopyTop + canopyH + sw / 2);
    shade.addColorStop(0, 'rgba(11,18,36,0.5)');
    shade.addColorStop(0.5, 'rgba(11,18,36,0.12)');
    shade.addColorStop(1, 'rgba(11,18,36,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(sx - over, canopyTop, s + over * 2, canopyH + sw / 2);
    ctx.fillStyle = '#e6b955';
    ctx.fillRect(sx - over, canopyTop - 1.5, s + over * 2, 2);

    // table: a wooden top over a navy cloth with the stand's name on it
    const clothTop = tableY + s * 0.03;
    const cloth = ctx.createLinearGradient(0, clothTop, 0, groundY);
    cloth.addColorStop(0, '#1e2f66');
    cloth.addColorStop(1, '#101a3a');
    ctx.fillStyle = cloth;
    ctx.fillRect(sx, clothTop, s, groundY - clothTop - s * 0.01);
    ctx.strokeStyle = 'rgba(230,185,85,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + s * 0.03, clothTop + s * 0.03, s * 0.94, groundY - clothTop - s * 0.07);
    ctx.fillStyle = '#4a321a';
    ctx.fillRect(sx - s * 0.02, tableY, s * 1.04, s * 0.032);
    ctx.fillStyle = 'rgba(246,217,138,0.4)';
    ctx.fillRect(sx - s * 0.02, tableY, s * 1.04, 1.5);

    const plateW = s * 0.66;
    const plateH = s * 0.17;
    const plateX = sx + (s - plateW) / 2;
    const plateY = clothTop + (groundY - clothTop - plateH) / 2 - s * 0.01;
    ctx.fillStyle = PAPER;
    roundRect(ctx, plateX, plateY, plateW, plateH, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127,83,16,0.55)';
    ctx.lineWidth = 1;
    roundRect(ctx, plateX + 3, plateY + 3, plateW - 6, plateH - 6, 2);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${s * 0.058}px Cinzel, "Times New Roman", serif`;
    ctx.fillText('Money Tree', plateX + plateW / 2, plateY + plateH * 0.34);
    ctx.fillText('Fun Pack', plateX + plateW / 2, plateY + plateH * 0.7);

    // packs, standing in rows of eight, each one's edge showing
    const pw = s * 0.075;
    const ph = s * 0.1;
    const shown = Math.min(24, Math.max(0, Math.round(st.stock)));
    ctx.lineWidth = 1;
    for (let i = 0; i < shown; i++) {
      const pile = Math.floor(i / 8);
      const k = i % 8;
      const x = sx + s * 0.04 + pile * s * 0.172 + k * s * 0.0125;
      const y = tableY - ph;
      ctx.fillStyle = k % 2 ? '#e4d3a8' : PAPER;
      roundRect(ctx, x, y, pw, ph, 1.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(42,29,10,0.4)';
      ctx.stroke();
      if (k === Math.min(7, shown - pile * 8 - 1)) {
        ctx.fillStyle = '#2c6b3b';
        ctx.beginPath();
        ctx.arc(x + pw / 2, y + ph * 0.4, pw * 0.26, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4a321a';
        ctx.fillRect(x + pw / 2 - 0.8, y + ph * 0.5, 1.6, ph * 0.28);
      }
    }

    // an open sample pack, its pages spread out
    if (st.sample) {
      const bx = sx + s * 0.555;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(bx + i * s * 0.022, tableY - s * 0.004);
        ctx.rotate(-0.5 + i * 0.32);
        ctx.fillStyle = i === 1 ? '#fbf6ea' : PAPER;
        ctx.fillRect(-s * 0.03, -s * 0.085, s * 0.06, s * 0.085);
        ctx.strokeStyle = 'rgba(127,83,16,0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let l = 1; l <= 3; l++) {
          ctx.moveTo(-s * 0.02, -s * 0.085 + l * s * 0.018);
          ctx.lineTo(s * 0.02, -s * 0.085 + l * s * 0.018);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // the price card on its little easel
    const cx = sx + s * 0.73;
    ctx.save();
    ctx.translate(cx, tableY);
    ctx.rotate(-0.06);
    ctx.fillStyle = PAPER;
    roundRect(ctx, -s * 0.07, -s * 0.15, s * 0.14, s * 0.15, 2);
    ctx.fill();
    ctx.fillStyle = '#7f5310';
    ctx.font = `700 ${s * 0.095}px Cinzel, "Times New Roman", serif`;
    ctx.fillText(`$${st.price}`, 0, -s * 0.07);
    ctx.restore();

    // the coin jar
    const jx = sx + s * 0.9;
    const jw = s * 0.085;
    const jh = s * 0.12;
    const level = Math.max(0, Math.min(1, st.jar));
    ctx.fillStyle = 'rgba(246,239,223,0.07)';
    roundRect(ctx, jx - jw / 2, tableY - jh, jw, jh, jw * 0.22);
    ctx.fill();
    if (level > 0) {
      ctx.save();
      roundRect(ctx, jx - jw / 2, tableY - jh, jw, jh, jw * 0.22);
      ctx.clip();
      ctx.fillStyle = '#c9963a';
      ctx.fillRect(jx - jw / 2, tableY - jh * level * 0.92, jw, jh);
      ctx.fillStyle = '#f0cc6e';
      ctx.fillRect(jx - jw / 2, tableY - jh * level * 0.92, jw, 1.5);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(246,239,223,0.55)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, jx - jw / 2, tableY - jh, jw, jh, jw * 0.22);
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,239,223,0.5)';
    ctx.fillRect(jx - jw * 0.42, tableY - jh - 2.5, jw * 0.84, 2.5);

    // bulbs along the awning's edge
    if (glow) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const bx = sx - over + (i + 0.5) * ((s + over * 2) / 6);
        const by = canopyTop + canopyH + sw / 2 + s * 0.012;
        const g = s * 0.16 * (0.9 + 0.1 * Math.sin(t * 1.7 + i * 1.3));
        ctx.drawImage(glow, bx - g / 2, by - g / 2, g, g);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function signBoard(st: MarketState) {
    if (!st.sign) return;
    const x = Math.min(W - s * 0.2, counterX + s * 0.78);
    const y = groundY + s * 0.005;
    const w = s * 0.3;
    const h = s * 0.36;
    ctx.fillStyle = '#2a1b10';
    ctx.fillRect(x - w * 0.42, y - h * 0.12, s * 0.018, h * 0.14);
    ctx.fillRect(x + w * 0.4, y - h * 0.12, s * 0.018, h * 0.14);
    ctx.fillStyle = '#0e1733';
    roundRect(ctx, x - w / 2, y - h, w, h * 0.92, 3);
    ctx.fill();
    ctx.strokeStyle = '#6b4a20';
    ctx.lineWidth = Math.max(2, s * 0.014);
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,239,223,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = Math.max(7, s * 0.043);
    ctx.font = `700 ${size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
    ['Keep kids', 'busy while', 'they learn'].forEach((line, i) => ctx.fillText(line, x, y - h * 0.8 + i * size * 1.25));
    ctx.fillStyle = '#e6b955';
    ctx.font = `700 ${size * 1.7}px Cinzel, "Times New Roman", serif`;
    ctx.fillText(`$${st.price}`, x, y - h * 0.24);
  }

  function draw(t: number, st: MarketState) {
    if (!W || !back) return;
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(back, 0, 0, W, H);

    // the string lights breathe a little
    if (glow) {
      ctx.globalCompositeOperation = 'lighter';
      for (const b of bulbs) {
        const g = s * 0.11 * (0.85 + 0.15 * Math.sin(t * 1.3 + b.phase));
        ctx.drawImage(glow, b.x - g / 2, b.y - g / 2, g, g);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // people drifting between the far booths
    const far = Math.round(1 + st.crowd * (drifters.length - 1));
    for (let i = 0; i < far; i++) {
      const d = drifters[i];
      d.x += d.dir * d.speed * s * dt;
      if (d.x < -30) d.x = W + 30;
      if (d.x > W + 30) d.x = -30;
      person(d.x, groundY + 1, s * d.tall, '#141f47', '#1a2550', 0, t * 4 + d.phase, d.dir < 0, false, false);
    }

    stall(t, st);
    signBoard(st);

    // customers
    const speed = Math.max(s * 1.5, (W - counterX + 60) / 1.05);
    for (let i = walkers.length - 1; i >= 0; i--) {
      const w = walkers[i];
      const target = counterX + w.stop * s * 0.34;
      w.clock += dt;
      if (w.state === 'in') {
        w.x -= speed * dt;
        if (w.x <= target) {
          w.x = target;
          w.state = 'at';
          w.clock = 0;
        }
      } else if (w.state === 'at') {
        if (!w.arrived && w.clock > 0.12) {
          w.arrived = true;
          w.onArrive?.();
          if (w.outcome === 'buy') coins.push({ x0: w.x - s * 0.08, y0: groundY - s * w.tall * 0.62, clock: 0 });
        }
        if (w.clock > 0.85) {
          w.state = 'out';
          w.clock = 0;
        }
      } else {
        w.x += speed * 0.9 * dt;
        if (w.x > W + 60) {
          walkers.splice(i, 1);
          continue;
        }
      }
    }
    if (st.guest) person(counterX + s * 0.04, groundY + s * 0.04, s * 0.3, '#24504c', '#7a5236', 0, 0, true, false, true);
    // draw back to front so the nearest person is on top
    const order = [...walkers].sort((a, b) => a.stop - b.stop);
    for (const w of order) {
      const walking = w.state !== 'at';
      const y = groundY + s * (0.03 + w.stop * 0.05);
      person(w.x, y, s * w.tall, w.coat, w.skin, w.hair, walking ? t * 9 + w.phase : 0, w.state !== 'out', w.state === 'out' && w.outcome === 'buy', true);
    }

    for (const w of order) {
      if (w.state === 'at' || (w.state === 'out' && w.clock < 0.35)) {
        const a = w.state === 'at' ? Math.min(1, w.clock / 0.12) : 1 - w.clock / 0.35;
        bubble(w.x, groundY + s * (0.03 + w.stop * 0.05) - s * w.tall - s * 0.02, w.line, w.outcome === 'buy', a);
      }
    }

    // coins on their way to the jar
    const jx = sx + s * 0.9;
    const jy = tableY - s * 0.12;
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.clock += dt;
      const u = c.clock / 0.42;
      if (u >= 1) {
        coins.splice(i, 1);
        continue;
      }
      const x = c.x0 + (jx - c.x0) * u;
      const y = c.y0 + (jy - c.y0) * u - Math.sin(u * Math.PI) * s * 0.16;
      ctx.fillStyle = '#e6b955';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2.5, s * 0.016), 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#f6d98a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function send(outcome: WalkOutcome, onArrive?: () => void) {
    const kid = rand() < 0.3;
    const lines = SAY[outcome];
    walkers.push({
      x: W + 30 + rand() * 20,
      stop: (sent++ % 3) / 2,
      state: 'in',
      clock: 0,
      outcome,
      onArrive,
      arrived: false,
      tall: kid ? 0.3 + rand() * 0.04 : 0.44 + rand() * 0.07,
      coat: COATS[Math.floor(rand() * COATS.length)],
      skin: SKINS[Math.floor(rand() * SKINS.length)],
      hair: Math.floor(rand() * 3),
      phase: rand() * TAU,
      line: lines[Math.floor(rand() * lines.length)],
    });
  }

  function clear() {
    walkers.length = 0;
    coins.length = 0;
  }

  return { resize, draw, send, clear };
}
