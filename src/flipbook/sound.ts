/**
 * Paper sounds, synthesised with Web Audio (no audio files to load).
 * A page turn is band-passed noise sweeping downward, like paper moving
 * through air, followed by a soft low tap when it lands.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = ctx.sampleRate * 1.5;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    // Pink-ish noise: paper sounds warmer than white noise.
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029591;
      b1 = 0.985 * b1 + w * 0.032534;
      b2 = 0.95 * b2 + w * 0.048056;
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.9;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function swish(at: number, dur: number, gain: number, fromHz: number, toHz: number) {
  const a = audio();
  if (!a || !noise) return;
  const src = a.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.25;

  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(fromHz, at);
  band.frequency.exponentialRampToValueAtTime(toHz, at + dur);

  const high = a.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 350;

  const env = a.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + dur * 0.25);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);

  src.connect(band).connect(high).connect(env).connect(a.destination);
  src.start(at, Math.random() * 0.5, dur + 0.05);
}

function tap(at: number, gain: number) {
  const a = audio();
  if (!a || !noise) return;
  const src = a.createBufferSource();
  src.buffer = noise;
  const low = a.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 520;
  const env = a.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
  src.connect(low).connect(env).connect(a.destination);
  src.start(at, Math.random(), 0.15);
}

export const paper = {
  /** One page leaving the stack. `heavy` for the hardcover boards. */
  turn(heavy = false) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.01;
    swish(t, heavy ? 0.42 : 0.36, heavy ? 0.16 : 0.2, heavy ? 1400 : 3200, heavy ? 500 : 900);
  },
  land(heavy = false) {
    const a = audio();
    if (!a) return;
    tap(a.currentTime + 0.005, heavy ? 0.5 : 0.22);
  },
  /** Many pages at once (jumping to a chapter). */
  riffle(count: number) {
    const a = audio();
    if (!a) return;
    const n = Math.min(count, 14);
    const t = a.currentTime + 0.01;
    for (let i = 0; i < n; i++) {
      swish(t + i * 0.045 + Math.random() * 0.015, 0.14, 0.09, 4200, 1600);
    }
    tap(t + n * 0.045 + 0.12, 0.2);
  },
};
