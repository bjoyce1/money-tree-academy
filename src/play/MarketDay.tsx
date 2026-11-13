import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'wouter';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Volume2, VolumeX } from 'lucide-react';
import { CHARACTERS, useGuideId } from '@/data/characters';
import { recordGame } from '@/lib/games';
import {
  BOY_COINS,
  CHANGE_OWED,
  CROWDS,
  DAYS,
  PACK_COST,
  PRICES,
  UPGRADES,
  answerEvent,
  formatMoney,
  isOver,
  maxPacks,
  newMarket,
  openStand,
  peopleToday,
  planCost,
  score,
  totals,
  type DayReport,
  type MarketEvent,
  type MarketGame,
  type Outcome,
  type UpgradeId,
  type Visit,
} from '@/lib/marketGame';
import { cn } from '@/lib/utils';
import { MarketScene, type MarketSceneHandle } from './MarketScene';
import { setSound, sound, soundOn } from './gameSound';

const gold =
  'inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-pill bg-gold px-7 text-[1.0625rem] font-bold text-night shadow-gold hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';
const quiet =
  'inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-pill border border-hairline px-6 text-[1.0625rem] font-bold text-cream hover:border-gold/60 hover:text-gold';
const choice =
  'flex min-h-[3.25rem] w-full items-center gap-3 rounded-choice border border-hairline px-4 py-2.5 text-left text-cream hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-60 aria-pressed:border-gold aria-pressed:bg-gold/[0.09]';
const settle = { type: 'spring' as const, visualDuration: 0.38, bounce: 0 };
const link = 'underline decoration-gold/40 underline-offset-4 hover:text-gold';

type Phase = 'intro' | 'plan' | 'selling' | 'report' | 'event' | 'answered' | 'done';
type Live = { marks: Outcome[]; sold: number; stock: number; takings: number };

const CROWD_LEVEL = { quiet: 0.2, steady: 0.55, busy: 1 } as const;
/** The jar in the picture is full at $80. */
const JAR_FULL = 8000;

export function MarketDay() {
  const guideId = useGuideId();
  const still = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  const [game, setGame] = useState<MarketGame>(() => newMarket());
  const [price, setPrice] = useState<number>(200);
  const [make, setMake] = useState(8);
  const [buy, setBuy] = useState<UpgradeId[]>([]);
  const [live, setLive] = useState<Live>({ marks: [], sold: 0, stock: 0, takings: 0 });
  const [cashAtOpen, setCashAtOpen] = useState(0);
  const [answered, setAnswered] = useState<{ event: MarketEvent; yes: boolean; madeOne: boolean } | null>(null);
  const [earned, setEarned] = useState<number | null>(null);
  const [muted, setMuted] = useState(() => !soundOn());
  const scene = useRef<MarketSceneHandle>(null);
  const timers = useRef<number[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const report: DayReport | undefined = game.history[game.history.length - 1];
  const result = useMemo(() => (phase === 'done' ? score(game) : null), [phase, game]);
  const most = maxPacks(game, buy);
  const today = game.day < DAYS ? CROWDS[game.crowds[game.day]] : null;

  useEffect(() => {
    if (phase !== 'intro') heading.current?.focus();
  }, [phase, game.day]);

  const startPlan = (g: MarketGame, keepMake = make) => {
    setBuy([]);
    setMake(Math.max(0, Math.min(maxPacks(g), keepMake)));
    setPhase('plan');
  };

  const start = () => {
    const g = newMarket();
    setGame(g);
    setEarned(null);
    setAnswered(null);
    setPrice(200);
    startPlan(g, 8);
  };

  const toggleBuy = (id: UpgradeId) => {
    const next = buy.includes(id) ? buy.filter((b) => b !== id) : [...buy, id];
    if (planCost(game, { price, make: 0, buy: next }) > game.cash) return;
    setBuy(next);
    setMake((m) => Math.min(m, maxPacks(game, next)));
  };

  const finishDay = (r: DayReport) => {
    clearTimers();
    scene.current?.clear();
    setLive({ marks: r.visits.map((v) => v.outcome), sold: r.sold, stock: r.leftover, takings: r.revenue });
    setPhase('report');
  };

  const open = () => {
    if (phase !== 'plan') return;
    clearTimers();
    const next = openStand(game, { price, make, buy });
    const r = next.history[next.history.length - 1];
    setCashAtOpen(game.cash - r.packCost - r.upgradeCost);
    setGame(next);
    setLive({ marks: [], sold: 0, stock: make, takings: 0 });
    setPhase('selling');
    sound.turn();
    if (still || r.visits.length === 0) {
      finishDay(r);
      return;
    }
    // People come a little faster on a busy day, so no day drags.
    const gap = Math.max(430, Math.min(820, 9500 / r.visits.length));
    let arrived = 0;
    const arrive = (v: Visit) => {
      arrived += 1;
      setLive((l) => ({
        marks: [...l.marks, v.outcome],
        sold: l.sold + (v.outcome === 'buy' ? 1 : 0),
        stock: l.stock - (v.outcome === 'buy' ? 1 : 0),
        takings: l.takings + (v.outcome === 'buy' ? r.price : 0),
      }));
      if (v.outcome === 'buy') sound.coin(1);
      else sound.pass();
      if (arrived === r.visits.length) later(1300, () => finishDay(r));
    };
    r.visits.forEach((v, i) => later(500 + i * gap, () => scene.current?.send(v.outcome, () => arrive(v))));
    // If the page was in the background and frames never ran, the day still ends.
    later(500 + r.visits.length * gap + 6000, () => finishDay(r));
  };

  const afterReport = () => {
    if (game.event) setPhase('event');
    else if (isOver(game)) finish(game);
    else startPlan(game);
  };

  const answer = (yes: boolean) => {
    if (!game.event || !report) return;
    setAnswered({ event: game.event, yes, madeOne: game.event === 'boy' && yes && report.leftover === 0 });
    const next = answerEvent(game, yes);
    setGame(next);
    setPhase('answered');
    if (yes) sound.coin(game.event === 'boy' ? 0 : 2);
    else sound.pass();
  };

  const afterAnswer = () => {
    if (isOver(game)) finish(game);
    else startPlan(game);
  };

  const finish = (g: MarketGame) => {
    const s = score(g);
    setEarned(recordGame('market-day', s.total, s.max));
    setPhase('done');
    sound.finish();
  };

  const toggleSound = () => {
    setSound(muted);
    setMuted(!muted);
  };

  // What the picture shows: the plan as you make it, then the day as it happens.
  const planning = phase === 'plan';
  const selling = phase === 'selling';
  const shownPrice = (planning || phase === 'intro' ? price : (report?.price ?? price)) / 100;
  const shownStock = phase === 'intro' ? 12 : planning ? make : selling || phase === 'report' ? live.stock : (report?.leftover ?? 0);
  const shownCash = selling ? cashAtOpen + live.takings : game.cash;
  const crowd = phase === 'intro' ? 0.6 : CROWD_LEVEL[game.crowds[Math.min(DAYS - 1, planning ? game.day : Math.max(0, game.day - 1))]];

  return (
    <div className="relative grid min-h-[100dvh] grid-rows-[auto_minmax(13.5rem,1fr)_auto] bg-night text-cream lg:grid-cols-[minmax(0,1fr)_minmax(25rem,31rem)] lg:grid-rows-1">
      <header className="col-span-full flex items-center gap-3 px-3 pt-3 sm:px-6 sm:pt-4 lg:absolute lg:inset-x-0 lg:top-0 lg:z-10">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-pill px-3 text-[0.9375rem] font-bold text-cream-2 hover:text-gold"
        >
          <ArrowLeft size={18} aria-hidden />
          <span className="max-sm:sr-only">Your progress</span>
          <span className="sm:hidden" aria-hidden>
            Back
          </span>
        </Link>
        <p className="flex-1 text-center font-display text-[1.05rem] font-bold text-gold sm:text-[1.2rem]">Market Day</p>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          className="inline-flex h-11 items-center gap-2 rounded-pill px-3 text-[0.9375rem] font-bold text-cream-2 hover:text-gold"
        >
          {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
          <span className="max-sm:sr-only">Sound</span>
        </button>
      </header>

      {/* The market */}
      <div className="relative min-h-0 lg:sticky lg:top-0 lg:h-[100dvh]">
        <MarketScene
          ref={scene}
          price={shownPrice}
          stock={shownStock}
          jar={Math.max(0, shownCash) / JAR_FULL}
          sign={game.upgrades.sign || (planning && buy.includes('sign')) || phase === 'intro'}
          sample={game.upgrades.sample || (planning && buy.includes('sample'))}
          crowd={crowd}
          guest={phase === 'event' ? game.event === 'boy' : phase === 'answered' && answered?.event === 'boy' && answered.yes}
          className="absolute inset-0 h-full w-full"
        />
        {phase !== 'intro' && phase !== 'done' && (
          <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[0.875rem] text-cream-3 [font-variant-numeric:tabular-nums] lg:bottom-6">
            {formatMoney(Math.max(0, shownCash))} in the business
          </p>
        )}
      </div>

      {/* The table */}
      <div className="flex min-w-0 flex-col justify-center px-5 pb-6 pt-3 sm:px-8 lg:min-h-[100dvh] lg:pb-10 lg:pl-2 lg:pr-10 lg:pt-20">
        {phase === 'intro' && <Intro onStart={start} />}

        {phase !== 'intro' && phase !== 'done' && (
          <>
            <DayDots done={planning ? game.day : game.day} current={planning ? game.day : -1} />
            <h1
              ref={heading}
              tabIndex={-1}
              className="mt-3 font-display text-[clamp(1.35rem,2.6vw,1.75rem)] font-bold leading-tight text-gold focus:outline-none"
            >
              {phase === 'event' || phase === 'answered' ? 'Before you pack up' : `Day ${planning ? game.day + 1 : game.day} of ${DAYS}`}
            </h1>
          </>
        )}

        {planning && today && (
          <div className="mt-2">
            <p className="text-pretty text-[1.0625rem] leading-snug text-cream">
              {today.forecast} About <strong>{peopleToday(game, buy)} people</strong> will pass your stand.
            </p>
            {report && (
              <p className="mt-1.5 text-[0.9375rem] text-cream-2">
                Yesterday at {formatMoney(report.price)}: {report.sold} bought
                {report.pricey > 0 && `, ${report.pricey} said it was too much`}
                {report.soldOut > 0 && `, ${report.soldOut} came after you sold out`}.
              </p>
            )}

            <fieldset className="mt-5">
              <legend className="font-bold text-cream">Price for one pack</legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {PRICES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={price === p}
                    onClick={() => setPrice(p)}
                    className="min-h-[3rem] rounded-choice border border-hairline font-display text-[1.25rem] font-bold text-cream hover:bg-white/[0.03] aria-pressed:border-gold aria-pressed:bg-gold/[0.09] aria-pressed:text-gold"
                    data-testid={`price-${p / 100}`}
                  >
                    {formatMoney(p)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[0.9375rem] text-cream-2">
                A pack costs {formatMoney(PACK_COST)} to make.{' '}
                {price > PACK_COST
                  ? `At ${formatMoney(price)} you keep ${formatMoney(price - PACK_COST)} from each one you sell.`
                  : `At ${formatMoney(price)} you keep nothing.`}
              </p>
            </fieldset>

            <div className="mt-5">
              <label htmlFor="packs" className="font-bold text-cream">
                Packs to make
              </label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMake((m) => Math.max(0, m - 1))}
                  disabled={make <= 0}
                  aria-label="One pack fewer"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-cream hover:border-gold/60 hover:text-gold disabled:opacity-40"
                >
                  <Minus size={18} aria-hidden />
                </button>
                <input
                  id="packs"
                  type="range"
                  min={0}
                  max={Math.max(1, most)}
                  value={make}
                  onChange={(e) => setMake(Math.min(most, Number(e.target.value)))}
                  className="h-11 min-w-0 flex-1 accent-[#e6b955]"
                  data-testid="input-packs"
                />
                <button
                  type="button"
                  onClick={() => setMake((m) => Math.min(most, m + 1))}
                  disabled={make >= most}
                  aria-label="One pack more"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-cream hover:border-gold/60 hover:text-gold disabled:opacity-40"
                >
                  <Plus size={18} aria-hidden />
                </button>
                <output htmlFor="packs" className="w-10 text-right font-display text-[1.5rem] font-bold text-gold [font-variant-numeric:tabular-nums]">
                  {make}
                </output>
              </div>
              <p className="mt-1 text-[0.9375rem] text-cream-2 [font-variant-numeric:tabular-nums]" role="status">
                Costs {formatMoney(make * PACK_COST)}. You have {formatMoney(game.cash - planCost(game, { price, make: 0, buy }))} for packs today.
              </p>
            </div>

            {(Object.keys(UPGRADES) as UpgradeId[]).some((u) => !game.upgrades[u]) && (
              <fieldset className="mt-5">
                <legend className="font-bold text-cream">Put money back into the stand</legend>
                <div className="mt-2 grid gap-2">
                  {(Object.keys(UPGRADES) as UpgradeId[])
                    .filter((u) => !game.upgrades[u])
                    .map((u) => {
                      const up = UPGRADES[u];
                      const on = buy.includes(u);
                      const tooMuch = !on && planCost(game, { price, make: 0, buy: [...buy, u] }) > game.cash;
                      return (
                        <button key={u} type="button" aria-pressed={on} disabled={tooMuch} onClick={() => toggleBuy(u)} className={choice} data-testid={`upgrade-${u}`}>
                          <span aria-hidden className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-current text-gold">
                            {on && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span className="flex-1">
                            <span className="block font-bold">{up.name}</span>
                            <span className="block text-[0.875rem] text-cream-3">{tooMuch ? 'Not enough money yet.' : up.detail}</span>
                          </span>
                          <span className="font-bold [font-variant-numeric:tabular-nums]">{formatMoney(up.cost)}</span>
                        </button>
                      );
                    })}
                </div>
              </fieldset>
            )}

            <button type="button" className={cn(gold, 'mt-6 w-full sm:w-auto')} onClick={open} data-testid="button-open">
              Open the stand <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        )}

        {selling && report && (
          <div className="mt-3">
            <dl className="grid grid-cols-3 divide-x divide-hairline border-y border-hairline text-center">
              {[
                ['Sold', String(live.sold)],
                ['In the jar today', formatMoney(live.takings)],
                ['Packs left', String(live.stock)],
              ].map(([label, value]) => (
                <div key={label} className="px-2 py-3">
                  <dt className="text-[0.875rem] text-cream-3">{label}</dt>
                  <dd className="mt-0.5 font-display text-[1.6rem] font-bold leading-none text-gold [font-variant-numeric:tabular-nums]">{value}</dd>
                </div>
              ))}
            </dl>
            <Marks marks={live.marks} total={report.visits.length} />
            <p className="sr-only" role="status">
              {live.marks.length} of {report.visits.length} people have come by. {live.sold} bought.
            </p>
            <button type="button" className={cn(quiet, 'mt-6 w-full sm:w-auto')} onClick={() => finishDay(report)} data-testid="button-skip">
              Skip to the end of the day
            </button>
          </div>
        )}

        {phase === 'report' && report && (
          <div className="mt-2">
            <Marks marks={live.marks} total={report.visits.length} />
            <Report report={report} guideId={guideId} still={!!still} />
            <button type="button" className={cn(gold, 'mt-6 w-full sm:w-auto')} onClick={afterReport} data-testid="button-next">
              {game.event ? 'Pack up' : isOver(game) ? 'See how you did' : 'Next day'} <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        )}

        {phase === 'event' && game.event && report && <Moment event={game.event} leftover={report.leftover} onAnswer={answer} />}

        {phase === 'answered' && answered && (
          <div className="mt-2">
            <Outcome_ answered={answered} />
            <button type="button" className={cn(gold, 'mt-6 w-full sm:w-auto')} onClick={afterAnswer} data-testid="button-next">
              {isOver(game) ? 'See how you did' : 'Next day'} <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        )}

        {phase === 'done' && result && (
          <Done headingRef={heading} game={game} result={result} earned={earned ?? 0} guideId={guideId} onAgain={() => setPhase('intro')} />
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ parts

function DayDots({ done, current }: { done: number; current: number }) {
  return (
    <ol className="flex gap-1.5" aria-hidden>
      {Array.from({ length: DAYS }, (_, i) => (
        <li key={i} className={cn('h-1.5 flex-1 rounded-full', i < done ? 'bg-gold' : i === current ? 'bg-gold/45' : 'bg-hairline')} />
      ))}
    </ol>
  );
}

/** One mark for everyone who came by: gold bought, a ring walked on, a dash came too late. */
function Marks({ marks, total }: { marks: Outcome[]; total: number }) {
  const count = (o: Outcome) => marks.filter((m) => m === o).length;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => {
          const m = marks[i];
          return (
            <span
              key={i}
              className={cn(
                'h-3 w-3 rounded-full border',
                !m && 'border-hairline',
                m === 'buy' && 'border-gold bg-gold',
                m === 'pricey' && 'border-cream-3',
                m === 'soldout' && 'border-dashed border-cream-3',
              )}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[0.875rem] text-cream-3 [font-variant-numeric:tabular-nums]">
        {count('buy')} bought · {count('pricey')} said too much · {count('soldout')} came too late
      </p>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h1 className="text-balance font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] text-gold">Market Day</h1>
      <p className="mt-4 max-w-measure text-[clamp(1.05rem,1.4vw,1.2rem)] leading-[1.6] text-cream-2">
        Five days at the Youth Market. You run the Money Tree Fun Pack stand, and you start with $10.
      </p>
      <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
        {[
          ['Price', 'Too high and people walk on. Too low and nothing is left for you.'],
          ['Packs', 'Each one costs $1 to make. Make too few and you run out. Make too many and they are left over.'],
          ['Profit', 'Revenue is what enters. Cost is what the work requires. Profit is what remains.'],
        ].map(([name, line]) => (
          <li key={name} className="flex items-baseline gap-4 py-3">
            <span className="w-16 shrink-0 font-display text-[1.1rem] font-semibold text-cream">{name}</span>
            <span className="text-cream-2">{line}</span>
          </li>
        ))}
      </ul>
      <button type="button" className={cn(gold, 'mt-7 w-full sm:w-auto')} onClick={onStart} data-testid="button-start">
        Set up the stand <ArrowRight size={18} aria-hidden />
      </button>
      <p className="mt-5 max-w-measure text-[0.875rem] leading-relaxed text-cream-3">
        The numbers are pretend. A real stand needs a trusted adult, a safe place, and the rules for selling where you live.
      </p>
    </div>
  );
}

function Line({ delay, still, children }: { delay: number; still: boolean; children: ReactNode }) {
  return (
    <motion.li initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...settle, delay: still ? 0 : delay }} className="py-2.5">
      {children}
    </motion.li>
  );
}

function Quote({ text, by, image }: { text: string; by: string; image?: string }) {
  return (
    <span className="flex items-center gap-3">
      {image ? <img src={image} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <LeafMark />}
      <span className="text-[0.9375rem] text-cream-2">
        <span className="italic text-cream">“{text}”</span> {by}
      </span>
    </span>
  );
}

/** The golden leaf that marks the tree's own words. */
function LeafMark() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline" aria-hidden>
      <svg viewBox="0 0 24 24" width={18} height={18}>
        <path d="M3 21C3 10 9 3 21 3c0 12-7 18-18 18Z" fill="#e6b955" />
        <path d="M3 21C8 14 13 9 19 5" stroke="#7f5310" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** One line the book already says, chosen for the day that just ended. */
function wisdom(r: DayReport): { text: string; by: string; image?: string } | null {
  const renee = CHARACTERS.find((c) => c.id === 'renee')!;
  const alex = CHARACTERS.find((c) => c.id === 'alex')!;
  const tree = 'The Money Tree';
  if (r.day === 1) return { text: 'Revenue is what enters. Cost is what the work requires. Profit is what remains.', by: tree };
  if (r.bought.length) return { text: 'Replace supply money before spending business income.', by: renee.name, image: renee.image };
  if (r.day === 3) return { text: 'Begin with a problem to solve, then test the smallest useful idea.', by: alex.name, image: alex.image };
  if (r.day === 5) return { text: 'Keep business money separate from personal money.', by: renee.name, image: renee.image };
  return null;
}

function Report({ report: r, guideId, still }: { report: DayReport; guideId: string; still: boolean }) {
  void guideId;
  const say = wisdom(r);
  const costs = r.packCost + r.upgradeCost;
  let d = 0.05;
  const step = (by: number) => (d += by) - by;
  const row = 'flex items-baseline justify-between gap-4';
  return (
    <ul className="mt-3 divide-y divide-hairline border-t border-hairline text-[1.0625rem] leading-snug" role="status">
      <Line delay={step(0.35)} still={still}>
        <span className={row}>
          <span>
            Revenue <span className="text-[0.9375rem] text-cream-3">{r.sold} sold × {formatMoney(r.price)}</span>
          </span>
          <strong className="text-cream [font-variant-numeric:tabular-nums]">{formatMoney(r.revenue)}</strong>
        </span>
      </Line>
      <Line delay={step(0.35)} still={still}>
        <span className={row}>
          <span>
            Cost{' '}
            <span className="text-[0.9375rem] text-cream-3">
              {r.made} made × {formatMoney(PACK_COST)}
              {r.bought.map((u) => `, ${UPGRADES[u].name.toLowerCase()} ${formatMoney(UPGRADES[u].cost)}`).join('')}
            </span>
          </span>
          <strong className="text-cream [font-variant-numeric:tabular-nums]">{formatMoney(-costs)}</strong>
        </span>
      </Line>
      <Line delay={step(0.5)} still={still}>
        <span className={row}>
          <span className="font-bold text-cream">{r.profit >= 0 ? 'Profit' : 'Loss'}</span>
          <strong className={cn('font-display text-[1.4rem] [font-variant-numeric:tabular-nums]', r.profit > 0 ? 'text-gold' : 'text-cream')}>
            {formatMoney(r.profit)}
          </strong>
        </span>
      </Line>
      <Line delay={step(0.4)} still={still}>
        <span className="text-cream-2">
          {r.soldOut > 0
            ? `${r.soldOut} ${r.soldOut === 1 ? 'person' : 'people'} wanted a pack after you sold out. More packs would have sold.`
            : r.leftover > 0
              ? `${r.leftover} ${r.leftover === 1 ? 'pack was' : 'packs were'} left over. ${r.leftover === 1 ? 'It goes' : 'They go'} to the family center.`
              : r.made > 0
                ? 'You made just the right amount.'
                : 'With nothing to sell, nothing came in.'}
          {r.pricey > r.sold + r.soldOut && r.price > 100 && ` Most people thought ${formatMoney(r.price)} was too much.`}
          {r.price === PACK_COST && r.sold > 0 && ' You were busy, but each pack sold for what it cost to make.'}
        </span>
      </Line>
      {say && (
        <Line delay={step(0.4)} still={still}>
          <Quote {...say} />
        </Line>
      )}
    </ul>
  );
}

function Moment({ event, leftover, onAnswer }: { event: MarketEvent; leftover: number; onAnswer: (yes: boolean) => void }) {
  const boy = event === 'boy';
  return (
    <div className="mt-2">
      <p className="text-pretty text-[1.0625rem] leading-relaxed text-cream">
        {boy
          ? 'A younger boy walks up holding seventy-five cents. “That is all I have,” he says.'
          : `Counting the jar, you find ${formatMoney(CHANGE_OWED)} too much. A customer paid with a five and left before she got her change. She is still at the next booth.`}
      </p>
      {boy && (
        <p className="mt-2 text-[0.9375rem] text-cream-2">
          {leftover > 0 ? 'You still have a pack on the table.' : 'The table is empty, but you could make one more pack for $1.'}
        </p>
      )}
      <div className="mt-5 grid gap-2">
        <button type="button" className={choice} onClick={() => onAnswer(true)} data-testid="answer-yes">
          <span className="flex-1">
            <span className="block font-bold">{boy ? 'Offer a trade' : `Take her the ${formatMoney(CHANGE_OWED)}`}</span>
            <span className="block text-[0.875rem] text-cream-3">
              {boy ? `His ${BOY_COINS} cents, and he helps you clean the table.` : 'It was never yours.'}
            </span>
          </span>
        </button>
        <button type="button" className={choice} onClick={() => onAnswer(false)} data-testid="answer-no">
          <span className="flex-1">
            <span className="block font-bold">{boy ? 'Tell him the price is the price' : 'Keep it'}</span>
            <span className="block text-[0.875rem] text-cream-3">{boy ? 'He does not have enough.' : `${formatMoney(CHANGE_OWED)} more in the jar today.`}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

function Outcome_({ answered }: { answered: { event: MarketEvent; yes: boolean; madeOne: boolean } }) {
  const tree = 'The Money Tree';
  const { event, yes, madeOne } = answered;
  const text =
    event === 'boy'
      ? yes
        ? `He paid his ${BOY_COINS} cents and wiped the table until it shone.${madeOne ? ' You made him one more pack for $1.' : ''} His mother thanked you. More people will hear about your stand.`
        : 'He put his coins away and walked on. In the book, Alex found a trade instead: the coins, and help cleaning up.'
      : yes
        ? 'She thanked you twice, and the people at her booth heard why. More of them will come by tomorrow.'
        : 'She came back looking for her change, and the people nearby saw. Fewer of them will stop tomorrow.';
  const quote =
    event === 'boy'
      ? { text: 'Money is a tool people use to trade value.', by: tree }
      : yes
        ? { text: 'Your name is part of everything you sell.', by: tree }
        : { text: 'Profit without honesty weakens the roots.', by: tree };
  return (
    <div role="status">
      <p className="text-pretty text-[1.0625rem] leading-relaxed text-cream">{text}</p>
      {(event !== 'boy' || yes) && (
        <p className="mt-4">
          <Quote {...quote} />
        </p>
      )}
    </div>
  );
}

function Done({
  headingRef,
  game,
  result,
  earned,
  guideId,
  onAgain,
}: {
  headingRef: RefObject<HTMLHeadingElement>;
  game: MarketGame;
  result: ReturnType<typeof score>;
  earned: number;
  guideId: string;
  onAgain: () => void;
}) {
  const guide = CHARACTERS.find((c) => c.id === guideId) ?? CHARACTERS[0];
  const t = totals(game);
  // The guide's own lines from the book: praise for a strong week, a tip otherwise.
  const guideLine =
    result.total >= 8
      ? guide.celebrationMessages[guide.id === 'alex' ? 2 : 1]
      : guide.id === 'alex'
        ? guide.encouragementMessages[0]
        : 'Replace supply money before spending business income.';
  const cheer =
    result.total === 10
      ? 'A full ten. A fair price, the right amount, and a name people trust.'
      : result.total >= 8
        ? 'A strong week. One more try could make it a ten.'
        : result.total >= 5
          ? 'A good start. Try another price, or put some profit back into the stand.'
          : 'A business takes practice. Try again and watch what each price does.';
  return (
    <div>
      <p className="text-[0.9375rem] text-cream-3">After {DAYS} days</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-bold leading-[1.08] text-gold focus:outline-none">
        {t.profit >= 0 ? `${formatMoney(t.profit)} profit` : `${formatMoney(-t.profit)} lost`}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-cream-2 [font-variant-numeric:tabular-nums]">
        {formatMoney(t.revenue)} revenue − {formatMoney(t.costs)} costs
      </p>
      <p className="mt-3 font-display text-[2.25rem] font-bold leading-none text-cream">
        {result.total} <span className="text-[1.1rem] text-cream-3">of {result.max}</span>
      </p>
      <p className="mt-3 max-w-measure text-[1.0625rem] text-cream">{cheer}</p>

      <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
        {result.parts.map((p) => (
          <li key={p.id} className="flex items-start gap-4 py-3">
            <span className="flex-1">
              <span className="block font-bold text-cream">{p.label}</span>
              <span className="block text-[0.9375rem] text-cream-2">{p.detail}</span>
            </span>
            <span className="shrink-0 font-display text-[1.1rem] font-bold text-gold [font-variant-numeric:tabular-nums]">
              {p.points}
              <span className="text-[0.8125rem] text-cream-3"> / {p.max}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4">
        <Quote text={guideLine} by={guide.name} image={guide.image} />
      </p>
      <p className="mt-4 text-[0.9375rem] text-cream-3" role="status">
        {earned > 0 ? `You earned ${earned} coins.` : 'Coins for this game come once a day. Play again tomorrow to earn more.'}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className={gold} onClick={onAgain} data-testid="button-again">
          Play again
        </button>
        <Link href="/dashboard" className={quiet}>
          Back to your progress
        </Link>
      </div>
      <p className="mt-5 text-[0.875rem] text-cream-3">
        Profit needs a job too:{' '}
        <Link href="/play/grow-the-tree" className={link}>
          play Grow the Tree
        </Link>
        . From the book:{' '}
        <Link href="/read/what-is-money-really" className={link}>
          What Is Money, Really?
        </Link>{' '}
        and{' '}
        <Link href="/read/turn-an-idea-into-a-business" className={link}>
          Turn an Idea Into a Business
        </Link>
        .
      </p>
    </div>
  );
}
