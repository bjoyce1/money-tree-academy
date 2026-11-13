import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Minus, Volume2, VolumeX } from 'lucide-react';
import { CHARACTERS, useGuideId } from '@/data/characters';
import { recordGame } from '@/lib/games';
import {
  COIN,
  GOALS,
  JARS,
  SEASONS,
  coinsToPlace,
  formatMoney,
  goldShare,
  isOver,
  newGame,
  playSeason,
  score,
  treeSize,
  treeStage,
  type GoalId,
  type Jar as JarId,
  type SeasonReport,
  type TreeGame,
} from '@/lib/treeGame';
import { cn } from '@/lib/utils';
import { TreeScene, type SceneWeather } from './TreeScene';
import { Jar } from './Jar';
import { setSound, sound, soundOn } from './gameSound';

const gold =
  'inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-pill bg-gold px-7 text-[1.0625rem] font-bold text-night shadow-gold hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';
const quiet =
  'inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-pill border border-hairline px-6 text-[1.0625rem] font-bold text-cream hover:border-gold/60 hover:text-gold';
const settle = { type: 'spring' as const, visualDuration: 0.38, bounce: 0 };

type Phase = 'intro' | 'place' | 'report' | 'done';
type View = { grow: number; planted: number; weather: SceneWeather };

/** A $5 coin. `layoutId` lets it travel between the tray and a jar. */
function Coin({ id, small }: { id: string; small?: boolean }) {
  return (
    <motion.span
      layoutId={id}
      transition={settle}
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-[#a87a25] font-bold text-[#3a2808] [background:radial-gradient(circle_at_35%_30%,#f9e3a3,#e6b955_55%,#c9963a)]',
        small ? 'h-[1.35rem] w-[1.35rem] text-[0.6875rem]' : 'h-9 w-9 text-[0.9375rem]',
      )}
    >
      5
    </motion.span>
  );
}

export function GrowTheTree() {
  const guideId = useGuideId();
  const still = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  const [goal, setGoal] = useState<GoalId>(guideId === 'alex' ? 'shoes' : 'tablet');
  const [game, setGame] = useState<TreeGame>(() => newGame(goal));
  // Which jar each of this season's coins is in; null is the tray.
  const [coins, setCoins] = useState<(JarId | null)[]>([]);
  const [view, setView] = useState<View>({ grow: 0, planted: 0, weather: 'calm' });
  const [float, setFloat] = useState<{ key: number; text: string; up: boolean } | null>(null);
  const [earned, setEarned] = useState<number | null>(null);
  const [muted, setMuted] = useState(() => !soundOn());
  const timers = useRef<number[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, still ? 0 : ms));

  const report: SeasonReport | undefined = game.history[game.history.length - 1];
  const plan = game.plan[Math.min(game.season, SEASONS - 1)];
  const goalInfo = GOALS[goal];
  const tray = coins.filter((c) => c === null).length;
  const placed = (jar: JarId) => coins.filter((c) => c === jar).length;
  const result = useMemo(() => (phase === 'done' ? score(game) : null), [phase, game]);

  // Move focus to the heading of each new screen so it is read out.
  useEffect(() => {
    if (phase !== 'intro') heading.current?.focus();
  }, [phase, game.season]);

  const beginSeason = (g: TreeGame) => {
    setCoins(Array(coinsToPlace(g)).fill(null));
    setView({ grow: g.grow, planted: g.planted, weather: 'calm' });
    setPhase('place');
  };

  const start = () => {
    const g = newGame(goal);
    setGame(g);
    setEarned(null);
    beginSeason(g);
  };

  const drop = (jar: JarId) => {
    if (phase !== 'place') return;
    if (!coins.includes(null)) return;
    // Work from the latest coins, so two quick taps place two coins.
    setCoins((c) => {
      const i = c.indexOf(null);
      return i < 0 ? c : c.map((v, k) => (k === i ? jar : v));
    });
    sound.coin(jar === 'spend' ? 0 : jar === 'save' ? 1 : 2);
  };

  const takeBack = (jar: JarId) => {
    if (!coins.includes(jar)) return;
    setCoins((c) => {
      const i = c.lastIndexOf(jar);
      return i < 0 ? c : c.map((v, k) => (k === i ? null : v));
    });
    sound.back();
  };

  const pass = () => {
    if (phase !== 'place' || tray > 0) return;
    clearTimers();
    const next = playSeason(game, { spend: placed('spend'), save: placed('save'), grow: placed('grow') });
    const r = next.history[next.history.length - 1];
    const plantedAfterCoins = game.planted + r.placed.grow;
    setGame(next);
    setPhase('report');
    setCoins([]);
    sound.turn();
    // The coins reach the roots first, then the season's weather arrives.
    setView({ grow: r.growBefore, planted: plantedAfterCoins, weather: 'calm' });
    later(750, () => {
      const kind: SceneWeather = r.weather.kind === 'storm' ? 'storm' : r.weather.kind === 'sun' ? 'sun' : 'calm';
      setView({ grow: r.growBefore + r.growChange, planted: plantedAfterCoins, weather: kind });
      if (r.growChange !== 0) {
        setFloat({ key: next.season, text: `${r.growChange > 0 ? '+' : ''}${formatMoney(r.growChange)}`, up: r.growChange > 0 });
        if (r.growChange > 0) sound.grow();
      }
      if (r.weather.kind === 'storm') sound.storm();
    });
    later(r.weather.kind === 'storm' ? 3600 : 2200, () => {
      setView({ grow: next.grow, planted: next.planted, weather: 'calm' });
      if (r.surprise) sound.surprise();
    });
  };

  const nextSeason = () => {
    clearTimers();
    setFloat(null);
    if (isOver(game)) {
      const s = score(game);
      setEarned(recordGame('grow-the-tree', s.total, s.max));
      setView({ grow: game.grow, planted: game.planted, weather: 'sun' });
      setPhase('done');
      sound.finish();
    } else {
      beginSeason(game);
    }
  };

  const toggleSound = () => {
    setSound(muted);
    setMuted(!muted);
  };

  const intro = phase === 'intro';
  const shownGrow = view.grow;
  const stage = treeStage(shownGrow);

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
        <p className="flex-1 text-center font-display text-[1.05rem] font-bold text-gold sm:text-[1.2rem]">Grow the Tree</p>
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

      {/* The tree */}
      <div className="relative min-h-0 lg:sticky lg:top-0 lg:h-[100dvh]">
        <TreeScene
          // Before the game starts, the tree shows what a patient plan can grow.
          size={intro ? 0.88 : treeSize(shownGrow)}
          gold={intro ? 0.3 : goldShare({ grow: shownGrow, planted: view.planted })}
          weather={intro ? 'sun' : view.weather}
          className="absolute inset-0 h-full w-full"
        />
        <AnimatePresence mode="wait">
          {float && phase === 'report' && (
            <motion.p
              key={float.key}
              aria-hidden
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: [0, 1, 1, 0], y: -22 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 2.6, times: [0, 0.18, 0.75, 1], ease: [0.2, 0.7, 0.2, 1] }}
              className={cn(
                'pointer-events-none absolute left-1/2 top-[9%] -translate-x-1/2 lg:top-[12%] font-display text-[clamp(1.6rem,4vw,2.6rem)] font-bold [text-shadow:0_2px_2px_rgba(11,18,36,0.55),0_8px_28px_rgba(11,18,36,0.65)]',
                float.up ? 'text-gold' : 'text-cream',
              )}
            >
              {float.text}
            </motion.p>
          )}
        </AnimatePresence>
        {phase !== 'intro' && (
          <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[0.875rem] text-cream-3 [font-variant-numeric:tabular-nums] lg:bottom-6">
            {stage} · {formatMoney(shownGrow)} in the tree
          </p>
        )}
      </div>

      {/* The table */}
      <div className="flex min-w-0 flex-col justify-center px-5 pb-6 pt-3 sm:px-8 lg:min-h-[100dvh] lg:pb-10 lg:pl-2 lg:pr-10 lg:pt-20">
        {phase === 'intro' && (
          <Intro goal={goal} onGoal={setGoal} onStart={start} />
        )}

        {(phase === 'place' || phase === 'report') && (
          <LayoutGroup>
            <SeasonDots done={phase === 'report' ? game.season : game.season} current={phase === 'place' ? game.season : -1} />
            <h1
              ref={heading}
              tabIndex={-1}
              className="mt-3 font-display text-[clamp(1.35rem,2.6vw,1.75rem)] font-bold leading-tight text-gold focus:outline-none"
            >
              Season {phase === 'report' ? game.season : game.season + 1} of {SEASONS}
            </h1>

            <div className="min-h-[9rem] sm:min-h-[11.5rem]">
            {phase === 'place' ? (
              <div className="mt-2">
                <p className="text-pretty text-[1.0625rem] leading-snug text-cream">
                  {plan.job} and earned <strong>{formatMoney(plan.income)}</strong>.
                  {game.debt > 0 && (
                    <>
                      {' '}
                      <span className="text-cream-2">
                        {formatMoney(Math.min(game.debt, plan.income))} of it paid back what you borrowed.
                      </span>
                    </>
                  )}
                </p>
                <div className="mt-4 flex min-h-[2.75rem] flex-wrap items-center gap-1.5" aria-hidden>
                  {coins.map((c, i) => (c === null ? <Coin key={i} id={`c${game.season}-${i}`} /> : null))}
                </div>
                <p className="mt-2 text-[0.9375rem] text-cream-2" role="status">
                  {tray > 0
                    ? `${tray} ${tray === 1 ? 'coin' : 'coins'} to place. Tap a jar to drop one in.`
                    : 'Every coin has a job.'}
                </p>
              </div>
            ) : (
              report && <Report report={report} game={game} goal={goal} guideId={guideId} still={!!still} />
            )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {JARS.map((j) => {
                const here = placed(j.id);
                // One disc for every $5 in the jar. Spend empties each season.
                const inJar = j.id === 'save' ? game.save / COIN + here : j.id === 'grow' ? game.grow / COIN + here : here;
                const caption =
                  j.id === 'save'
                    ? `${formatMoney(game.save)} of ${formatMoney(goalInfo.cost)}`
                    : j.id === 'grow'
                      ? `${formatMoney(game.grow)} in the tree`
                      : game.treats === 1
                        ? '1 treat'
                        : `${game.treats} treats`;
                return (
                  <div key={j.id} className="relative flex flex-col items-center">
                    <motion.button
                      type="button"
                      onClick={() => drop(j.id)}
                      disabled={phase !== 'place' || tray === 0}
                      whileTap={{ scale: 0.96 }}
                      transition={settle}
                      className={cn(
                        'group relative flex w-full flex-col items-center rounded-choice px-1 pb-2 hover:bg-white/[0.04] disabled:cursor-default disabled:hover:bg-transparent',
                        phase === 'place' ? 'pt-7' : 'pt-2 sm:pt-7',
                      )}
                      aria-label={`${j.name} jar, ${j.hint.toLowerCase()}. ${caption}. ${here} ${here === 1 ? 'coin' : 'coins'} placed this season.`}
                      data-testid={`jar-${j.id}`}
                    >
                      <span className="absolute inset-x-0 top-0 flex h-7 items-center justify-center -space-x-1.5" aria-hidden>
                        {coins.map((c, i) => (c === j.id ? <Coin key={i} id={`c${game.season}-${i}`} small /> : null))}
                      </span>
                      <Jar label={j.name} coins={inJar} markAt={j.id === 'save' ? goalInfo.cost / COIN : undefined} className="h-auto w-[min(100%,6.75rem)]" />
                      <span className="mt-1.5 hidden text-[0.875rem] text-cream-2 sm:block">{j.hint}</span>
                      <span className="text-[0.875rem] text-cream-3 [font-variant-numeric:tabular-nums] max-sm:mt-1.5">
                        {j.id === 'grow' ? (
                          <>
                            {formatMoney(game.grow)}
                            <span className="max-sm:hidden"> in the tree</span>
                          </>
                        ) : (
                          caption
                        )}
                      </span>
                    </motion.button>
                    {phase === 'place' && here > 0 && (
                      <button
                        type="button"
                        onClick={() => takeBack(j.id)}
                        className="absolute -top-1 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-night text-cream-2 hover:border-gold/60 hover:text-gold"
                        aria-label={`Take one coin back from ${j.name}`}
                      >
                        <Minus size={16} aria-hidden />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              {phase === 'place' ? (
                <button type="button" className={cn(gold, 'w-full sm:w-auto')} disabled={tray > 0} onClick={pass} data-testid="button-pass">
                  Let the season pass <ArrowRight size={18} aria-hidden />
                </button>
              ) : (
                <button type="button" className={cn(gold, 'w-full sm:w-auto')} onClick={nextSeason} data-testid="button-next">
                  {isOver(game) ? 'See your tree' : 'Next season'} <ArrowRight size={18} aria-hidden />
                </button>
              )}
            </div>
          </LayoutGroup>
        )}

        {phase === 'done' && result && (
          <Done
            headingRef={heading}
            game={game}
            result={result}
            earned={earned ?? 0}
            guideId={guideId}
            onAgain={() => setPhase('intro')}
          />
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ parts

function SeasonDots({ done, current }: { done: number; current: number }) {
  return (
    <ol className="flex gap-1.5" aria-hidden>
      {Array.from({ length: SEASONS }, (_, i) => (
        <li
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            i < done ? 'bg-gold' : i === current ? 'bg-gold/45' : 'bg-hairline',
          )}
        />
      ))}
    </ol>
  );
}

function Intro({ goal, onGoal, onStart }: { goal: GoalId; onGoal: (g: GoalId) => void; onStart: () => void }) {
  return (
    <div>
      <h1 className="text-balance font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] text-gold">Grow the Tree</h1>
      <p className="mt-4 max-w-measure text-[clamp(1.05rem,1.4vw,1.2rem)] leading-[1.6] text-cream-2">
        Eight seasons at the Money Tree. Each season you earn coins. Give every coin a job.
      </p>
      <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
        {[
          ['Spend', 'Small treats today. Wants are not bad.'],
          ['Save', 'Safe money for your goal, and for surprises.'],
          ['Grow', 'Feeds the tree. It can grow each season, and it can shrink in a storm.'],
        ].map(([name, line]) => (
          <li key={name} className="flex items-baseline gap-4 py-3">
            <span className="w-16 shrink-0 font-display text-[1.1rem] font-semibold text-cream">{name}</span>
            <span className="text-cream-2">{line}</span>
          </li>
        ))}
      </ul>

      <fieldset className="mt-7">
        <legend className="text-[1.0625rem] font-bold text-cream">What are you saving for?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(GOALS) as GoalId[]).map((id) => {
            const g = GOALS[id];
            const who = CHARACTERS.find((c) => c.id === g.owner)!;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={goal === id}
                onClick={() => onGoal(id)}
                className="flex items-center gap-3 rounded-choice border border-hairline px-3 py-2.5 text-left hover:bg-white/[0.03] aria-pressed:border-gold aria-pressed:bg-gold/[0.09]"
                data-testid={`goal-${id}`}
              >
                <img src={who.image} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                <span>
                  <span className="block font-bold text-cream">{g.name}</span>
                  <span className="block text-[0.875rem] text-cream-3">
                    {who.name}’s goal · {formatMoney(g.cost)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <button type="button" className={cn(gold, 'mt-7 w-full sm:w-auto')} onClick={onStart} data-testid="button-start">
        Start season 1 <ArrowRight size={18} aria-hidden />
      </button>
      <p className="mt-5 max-w-measure text-[0.875rem] leading-relaxed text-cream-3">
        The numbers are pretend, so you can watch a tree grow in minutes. Real growth is slower, and it is never promised.
      </p>
    </div>
  );
}

function Line({ delay, still, children }: { delay: number; still: boolean; children: ReactNode }) {
  return (
    <motion.li
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...settle, delay: still ? 0 : delay }}
      className="py-2.5"
    >
      {children}
    </motion.li>
  );
}

/** One line the book already says, chosen for what just happened. */
function wisdom(r: SeasonReport, guideId: string): { text: string; by: string; image?: string } | null {
  const renee = CHARACTERS.find((c) => c.id === 'renee')!;
  const alex = CHARACTERS.find((c) => c.id === 'alex')!;
  const tree = 'The Money Tree';
  if (r.surprise?.borrowed) return { text: 'Pay later does not mean pay less. Always check the total.', by: renee.name, image: renee.image };
  if (r.surprise?.fromGrow) return { text: 'Do not invest money you will need soon.', by: renee.name, image: renee.image };
  if (r.surprise) return { text: 'A little saved once is helpful. A little saved often is powerful.', by: tree };
  if (r.weather.kind === 'storm' && r.growBefore > 0) return { text: 'Fast growth can bring fast loss. Never confuse possibility with a promise.', by: tree };
  // The same reminder every season would stop being heard, so these take turns.
  if (r.placed.save === 0 && r.placed.spend > 0 && r.season % 2 === 1)
    return { text: 'Saving is not what happens after spending. Saving is part of the plan.', by: tree };
  if (r.placed.spend >= 3 * COIN && r.season % 2 === 0) return { text: 'Before spending, ask: What else could this money do?', by: renee.name, image: renee.image };
  // On quiet seasons, a tip now and then: Renee's and Alex's from chapters 5 and 9.
  const tips: Record<number, { text: string; by: string; image?: string }> = {
    2: { text: 'Choose the savings amount before spending.', by: renee.name, image: renee.image },
    4: { text: 'Keep different goals separate so each dollar has a clear job.', by: alex.name, image: alex.image },
    6: { text: 'Know the goal, know the risk, spread the seeds, and give them time.', by: alex.name, image: alex.image },
  };
  void guideId;
  return tips[r.season] ?? null;
}

function Report({ report: r, game, goal, guideId, still }: { report: SeasonReport; game: TreeGame; goal: GoalId; guideId: string; still: boolean }) {
  const storm = r.weather.kind === 'storm';
  const pct = Math.abs(r.weather.percent);
  const say = wisdom(r, guideId);
  const s = r.surprise;
  const left = GOALS[goal].cost - game.save;
  let d = 0.1;
  const step = (by: number) => (d += by) - by;

  return (
    <ul className="mt-2 divide-y divide-hairline text-[1.0625rem] leading-snug" role="status">
      {r.treat && (
        <Line delay={step(0.5)} still={still}>
          You spent {formatMoney(r.placed.spend)} and enjoyed {r.treat}.
          {r.placed.spend > 2 * COIN && <span className="text-cream-2"> More of the same did not add more fun.</span>}
        </Line>
      )}
      <Line delay={step(0.9)} still={still}>
        {r.growBefore === 0 ? (
          <>
            {storm ? 'A storm blew through.' : 'A good season for growing.'}{' '}
            <span className="text-cream-2">Nothing is planted yet, so the tree is still a seed.</span>
          </>
        ) : storm ? (
          <>
            A storm. Your Grow money fell {pct}%: <strong className="text-cream">{formatMoney(r.growChange)}</strong>.{' '}
            <span className="text-cream-2">Storms pass.</span>
          </>
        ) : (
          <>
            {r.weather.kind === 'sun' ? 'A sunny season.' : 'A steady season.'} Your Grow money grew {pct}%:{' '}
            <strong className="text-gold">+{formatMoney(r.growChange)}</strong>.
            {r.season >= 2 && r.season < SEASONS && game.grow > game.planted && <span className="text-cream-2"> Next season that growth can grow too.</span>}
          </>
        )}
      </Line>
      {s && (
        <Line delay={step(1.2)} still={still}>
          <strong className="text-cream">A surprise.</strong> {s.name}: {formatMoney(s.cost)}.{' '}
          <span className="text-cream-2">
            {s.fromSave === s.cost
              ? 'Your Save jar paid for it. That is what just-in-case money is for.'
              : s.borrowed > 0
                ? `Your jars could not cover it, so you borrowed ${formatMoney(s.borrowed)}. Next season you pay back ${formatMoney(s.owed)}.`
                : `Your Save jar was short, so ${formatMoney(s.fromGrow)} came out of the tree early.`}
          </span>
        </Line>
      )}
      {!s && r.placed.save > 0 && (
        <Line delay={step(0.4)} still={still}>
          <span className="text-cream-2">
            {left > 0
              ? `${formatMoney(left)} more to save for the ${GOALS[goal].short}.`
              : `You have enough saved for the ${GOALS[goal].short}.`}
          </span>
        </Line>
      )}
      {say && (
        <Line delay={step(0.4)} still={still}>
          <span className="flex items-center gap-3">
            {say.image ? (
              <img src={say.image} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <LeafMark />
            )}
            <span className="text-[0.9375rem] text-cream-2">
              <span className="italic text-cream">“{say.text}”</span> {say.by}
            </span>
          </span>
        </Line>
      )}
    </ul>
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

function Done({
  headingRef,
  game,
  result,
  earned,
  guideId,
  onAgain,
}: {
  headingRef: RefObject<HTMLHeadingElement>;
  game: TreeGame;
  result: ReturnType<typeof score>;
  earned: number;
  guideId: string;
  onAgain: () => void;
}) {
  const guide = CHARACTERS.find((c) => c.id === guideId) ?? CHARACTERS[0];
  const growth = Math.max(0, game.grow - game.planted);
  // The guide's own lines from the book: praise for a strong plan, a tip otherwise.
  const guideLine = result.total >= 8 ? guide.celebrationMessages[0] : guide.encouragementMessages[guide.id === 'alex' ? 2 : 1];
  const cheer =
    result.total === 10
      ? 'A full ten. You saved first, stayed ready, and gave the tree time.'
      : result.total >= 8
        ? 'A strong plan. One more try could make it a ten.'
        : result.total >= 5
          ? 'A good start. Try planting earlier, or saving first, and watch what changes.'
          : 'Money choices take practice. Try again and give every coin a job.';
  return (
    <div>
      <p className="text-[0.9375rem] text-cream-3">After {SEASONS} seasons</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-bold leading-[1.08] text-gold focus:outline-none">
        {treeStage(game.grow)}
      </h1>
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

      {growth > 0 && (
        <p className="mt-4 max-w-measure text-[0.9375rem] text-cream-2">
          The gold leaves are the {formatMoney(growth)} your tree earned. Growth that earns more growth is called{' '}
          <Link href="/read/glossary" className="underline decoration-gold/40 underline-offset-4 hover:text-gold">
            compounding
          </Link>
          .
        </p>
      )}
      <p className="mt-4 flex items-center gap-3 text-[0.9375rem] text-cream-2">
        <img src={guide.image} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
        <span>
          <span className="italic text-cream">“{guideLine}”</span> {guide.name}
        </span>
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
        From the book:{' '}
        <Link href="/read/save-first-spend-second" className="underline decoration-gold/40 underline-offset-4 hover:text-gold">
          Save First, Spend Second
        </Link>{' '}
        and{' '}
        <Link href="/read/make-your-money-work" className="underline decoration-gold/40 underline-offset-4 hover:text-gold">
          Make Your Money Work
        </Link>
        .
      </p>
    </div>
  );
}
