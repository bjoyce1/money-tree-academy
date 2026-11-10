import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';

const RATES = [
  { value: 0.8, label: 'Slower' },
  { value: 1, label: 'Normal' },
  { value: 1.2, label: 'Faster' },
];

/** Split the story into short pieces; long utterances get cut off in some browsers. */
export function speechChunks(text: string) {
  return text
    .split(/\n+/)
    .flatMap((para) => para.match(/[^.!?]+[.!?]+["”’]?|[^.!?]+$/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
}

export type Speech = ReturnType<typeof useSpeech>;

/** Read text aloud with the device's own voice. Owned by the page, so it keeps going when the tools close. */
export function useSpeech(text: string) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const chunks = useMemo(() => speechChunks(text), [text]);
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [index, setIndex] = useState(0);
  const [rate, setRateState] = useState(1);
  const rateRef = useRef(1);
  const indexRef = useRef(0);
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
    if (supported) window.speechSynthesis.cancel();
    setState('idle');
    setIndex(0);
    indexRef.current = 0;
  }, [supported]);

  // A new chapter starts from the top; leaving the page stops reading.
  useEffect(() => stop, [text, stop]);

  const play = useCallback(
    (start = indexRef.current) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const id = ++run.current;
      const say = (i: number) => {
        if (id !== run.current) return;
        if (i >= chunks.length) {
          setState('idle');
          setIndex(0);
          indexRef.current = 0;
          return;
        }
        setIndex(i);
        indexRef.current = i;
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.rate = rateRef.current;
        u.lang = 'en-US';
        u.onend = () => say(i + 1);
        u.onerror = () => {
          if (id === run.current) setState('idle');
        };
        synth.speak(u);
      };
      setState('playing');
      say(start);
    },
    [chunks, supported],
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setState('playing');
  }, []);

  const setRate = useCallback(
    (r: number) => {
      rateRef.current = r;
      setRateState(r);
      if (state === 'playing') play(indexRef.current);
    },
    [play, state],
  );

  const pct = chunks.length ? Math.round((index / chunks.length) * 100) : 0;
  return { supported, state, index, pct, rate, setRate, play, pause, resume, stop };
}

const goldButton =
  'inline-flex min-h-[3rem] items-center gap-2 rounded-pill bg-gold px-5 font-bold text-night hover:bg-gold-hover';

export function ListenTool({ speech, title }: { speech: Speech; title: string }) {
  const { supported, state, index, pct, rate, setRate, play, pause, resume, stop } = speech;

  if (!supported) {
    return <p className="text-reader-soft">This browser can't read aloud. Try a recent Chrome, Edge or Safari.</p>;
  }

  return (
    <div>
      <p className="text-reader-soft">
        Listen to “{title}” read aloud by your device. It keeps reading when you close this panel.
      </p>
      <div className="mt-5 flex items-center gap-2">
        {state === 'playing' ? (
          <button type="button" onClick={pause} className={goldButton}>
            <Pause size={18} aria-hidden /> Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (state === 'paused' ? resume() : play())}
            className={goldButton}
            data-testid="button-listen"
          >
            <Play size={18} aria-hidden /> {state === 'paused' ? 'Resume' : index > 0 ? 'Keep listening' : 'Listen'}
          </button>
        )}
        <button
          type="button"
          onClick={stop}
          disabled={state === 'idle' && index === 0}
          className="inline-flex h-12 w-12 items-center justify-center rounded-pill border border-reader-rule hover:border-reader-accent hover:text-reader-accent disabled:opacity-40"
          aria-label="Stop"
        >
          <Square size={16} aria-hidden />
        </button>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-reader-wash" aria-hidden>
        <div className="h-full origin-left bg-reader-accent" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <p className="mt-2 text-[0.875rem] text-reader-quiet" aria-live="polite">
        {state === 'idle' && index === 0 ? 'Ready' : `${pct}% read`}
      </p>
      <fieldset className="mt-6">
        <legend className="text-[0.875rem] text-reader-quiet">Speed</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RATES.map((r) => (
            <label
              key={r.value}
              className="inline-flex min-h-[2.75rem] cursor-pointer items-center rounded-pill border border-reader-rule px-4 has-[:checked]:border-reader-accent has-[:checked]:bg-reader-wash has-[:checked]:text-reader-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--r-accent)]"
            >
              <input
                type="radio"
                name="listen-rate"
                value={r.value}
                checked={rate === r.value}
                onChange={() => setRate(r.value)}
                className="sr-only"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
