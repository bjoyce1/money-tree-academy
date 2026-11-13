/**
 * Game sounds, made with Web Audio (no audio files to load): coins on glass,
 * a soft rise when the tree grows, wind in a storm. Quiet by design, and
 * silent until the player has touched the page.
 */

const KEY = 'game_sound';
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let on = readPref();

function readPref() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export const soundOn = () => on;

export function setSound(value: boolean) {
  on = value;
  try {
    localStorage.setItem(KEY, value ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

function audio(): AudioContext | null {
  if (!on || typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      b = 0.97 * b + (Math.random() * 2 - 1) * 0.06;
      data[i] = b * 4;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A struck tone that rings out: the body of a coin or a glass. */
function ping(a: AudioContext, at: number, hz: number, gain: number, ring: number, type: OscillatorType = 'sine') {
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.value = hz;
  const env = a.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, at + ring);
  osc.connect(env).connect(a.destination);
  osc.start(at);
  osc.stop(at + ring + 0.02);
}

function hush(a: AudioContext, at: number, dur: number, gain: number, fromHz: number, toHz: number) {
  if (!noise) return;
  const src = a.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const band = a.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.7;
  band.frequency.setValueAtTime(fromHz, at);
  band.frequency.exponentialRampToValueAtTime(toHz, at + dur);
  const env = a.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + dur * 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(band).connect(env).connect(a.destination);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur + 0.05);
}

export const sound = {
  /** A coin landing in a glass jar. Each jar has its own pitch. */
  coin(jar: 0 | 1 | 2 = 1) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.005;
    const base = [1760, 2093, 2349][jar] * (0.985 + Math.random() * 0.03);
    ping(a, t, base, 0.07, 0.22, 'triangle');
    ping(a, t, base * 2.76, 0.03, 0.12);
    ping(a, t + 0.012, 380, 0.05, 0.07);
  },
  /** A coin taken back out. */
  back() {
    const a = audio();
    if (!a) return;
    ping(a, a.currentTime + 0.005, 520, 0.05, 0.09, 'triangle');
  },
  /** Someone walked on without buying: a soft, low step. */
  pass() {
    const a = audio();
    if (!a) return;
    ping(a, a.currentTime + 0.005, 196, 0.035, 0.12, 'triangle');
  },
  /** The season turns. */
  turn() {
    const a = audio();
    if (!a) return;
    hush(a, a.currentTime + 0.01, 0.7, 0.05, 900, 2600);
  },
  /** The tree grew: three warm notes rising. */
  grow() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.02;
    [392, 493.9, 587.3].forEach((hz, i) => {
      ping(a, t + i * 0.11, hz, 0.06, 0.7);
      ping(a, t + i * 0.11, hz * 2, 0.015, 0.4);
    });
  },
  /** A storm: wind, and a low drop. */
  storm() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.02;
    hush(a, t, 2.2, 0.12, 300, 900);
    hush(a, t + 0.4, 1.6, 0.06, 1800, 700);
    ping(a, t + 0.2, 110, 0.07, 0.9);
  },
  /** A surprise bill. */
  surprise() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.01;
    ping(a, t, 330, 0.07, 0.25, 'triangle');
    ping(a, t + 0.14, 262, 0.07, 0.4, 'triangle');
  },
  /** The game is over: a short, settled chord. */
  finish() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.02;
    [261.6, 329.6, 392, 523.3].forEach((hz, i) => ping(a, t + i * 0.09, hz, 0.055, 1.4));
  },
};
