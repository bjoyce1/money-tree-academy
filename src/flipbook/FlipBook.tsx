import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  CHAPTERS,
  LEAVES,
  SEQ,
  TOTAL_PAGES,
  chapterForSeq,
  isRigid,
  leafBack,
  leafFront,
  pageImage,
  sideForSeq,
  spreadForSeq,
  textForFace,
  type Tier,
} from "./book";
import type { Dir } from "./geometry";
import { Leaf, type Bend } from "./Leaf";
import { paper } from "./sound";
import { useBookSize } from "./useBookSize";
import { Chrome, type Panel } from "./Chrome";
import "./flipbook.css";

const STORE_KEY = "mtol-flipbook-v1";
const SOUND_KEY = "mtol-flipbook-sound";
/** Pages within this many leaves of the open spread load full-quality images. */
const LOAD_WINDOW = 3;
const PEEL = 0.045;

/** Page turn on click / key: lift slowly, swing, settle. */
const TURN_EASE = [0.42, 0.04, 0.22, 1] as const;
const TURN_DURATION = 0.95;
/** Release after a drag: a spring keeps the hand's velocity. */
const RELEASE = { type: "spring" as const, visualDuration: 0.55, bounce: 0 };

type Side = "left" | "right";

interface Gesture {
  id: number;
  x0: number;
  y0: number;
  active: boolean;
  kind?: "flip" | "pan";
  leaf?: number;
  p0?: number;
  f0?: number;
  span?: number;
  samples: { x: number; t: number }[];
}

function readStore(): { spread: number; side: Side } {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      const spread = Math.min(LEAVES, Math.max(0, Number(v.spread) || 0));
      return { spread, side: v.side === "left" ? "left" : "right" };
    }
  } catch {
    /* storage unavailable: start at the cover */
  }
  return { spread: 0, side: "right" };
}

export default function FlipBook() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useBookSize(stageRef);
  const reduced = useReducedMotion() ?? false;
  const single = size?.mode === "single";

  /* ----------------------------------------------------------- state */

  // One progress value per leaf: 0 = resting right, 1 = turned to the left.
  const leaves = useMemo(() => Array.from({ length: LEAVES }, () => motionValue(0)), []);
  // `/flipbook?page=<printed page>` (from the home page's chapter index):
  // start closed on the cover, then riffle to that page once the book lands.
  const deepLinkSeq = useMemo(() => {
    const n = Number(new URLSearchParams(window.location.search).get("page"));
    return Number.isInteger(n) && n >= 1 && n <= TOTAL_PAGES ? n - 1 : null;
  }, []);
  const initial = useMemo(
    () => (deepLinkSeq !== null ? { spread: 0, side: "right" as Side } : readStore()),
    [deepLinkSeq]
  );
  const targetRef = useRef(initial.spread);
  const sideRef = useRef<Side>(initial.side);
  const [spread, setSpread] = useState(initial.spread);
  const [side, setSide] = useState<Side>(initial.side);

  const bendsRef = useRef<Record<number, Bend>>({});
  const [bends, setBends] = useState<Record<number, Bend>>({});
  const controls = useRef(new Map<number, AnimationPlaybackControls>());

  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const [panel, setPanel] = useState<Panel>(null);
  const [touched, setTouched] = useState(initial.spread > 0);

  // Single-page camera: 0 = looking at the left page, 1 = the right page.
  const focus = useMotionValue(initial.side === "right" ? 1 : 0);
  const focusAnim = useRef<AnimationPlaybackControls | null>(null);
  const boardW = useMotionValue(0);
  const singleMv = useMotionValue(0);

  useEffect(() => {
    leaves.forEach((mv, i) => mv.set(i < initial.spread ? 1 : 0));
  }, [leaves, initial.spread]);

  useEffect(() => {
    if (!size) return;
    boardW.set(size.boardW);
    singleMv.set(size.mode === "single" ? 1 : 0);
  }, [size, boardW, singleMv]);

  // The closed book sits centred; it slides as a cover opens. In single mode
  // a camera pans between the left and right page instead.
  const bookX = useTransform(() => {
    const bw = boardW.get();
    if (singleMv.get() === 1) return -bw * focus.get();
    return ((leaves[LEAVES - 1].get() - (1 - leaves[0].get())) * bw) / 2;
  });
  const leftGround = useTransform(() => leaves[0].get());
  const rightGround = useTransform(() => 1 - leaves[LEAVES - 1].get());

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ spread, side }));
    } catch {
      /* ignore */
    }
  }, [spread, side]);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, [soundOn]);

  /* ------------------------------------------------------- helpers */

  const setBend = useCallback((i: number, b: Bend | null) => {
    const next = { ...bendsRef.current };
    if (b) next[i] = b;
    else delete next[i];
    bendsRef.current = next;
    setBends(next);
  }, []);

  const strips = single ? 8 : 10;

  const commit = useCallback((t: number, s: Side) => {
    targetRef.current = t;
    sideRef.current = s;
    setSpread(t);
    setSide(s);
  }, []);

  const sound = useMemo(
    () => ({
      turn: (heavy?: boolean) => soundRef.current && paper.turn(heavy),
      land: (heavy?: boolean) => soundRef.current && paper.land(heavy),
      riffle: (n: number) => soundRef.current && paper.riffle(n),
    }),
    []
  );

  const peelRef = useRef<{ leaf: number; rest: 0 | 1 } | null>(null);

  /** Animate leaf i to turned (1) or resting (0). */
  const runFlip = useCallback(
    (
      i: number,
      toTurned: boolean,
      opts: { velocity?: number; delay?: number; duration?: number; strips?: number; spring?: boolean; land?: boolean } = {}
    ) => {
      const mv = leaves[i];
      const target = toTurned ? 1 : 0;
      if (peelRef.current?.leaf === i) peelRef.current = null;
      const existing = bendsRef.current[i];
      const dir: Dir = existing?.dir ?? (toTurned ? 1 : -1);
      setBend(i, { dir, strips: isRigid(i) ? 1 : opts.strips ?? existing?.strips ?? strips });
      controls.current.get(i)?.stop();

      if (reduced) {
        mv.set(target);
        setBend(i, null);
        return;
      }

      const onComplete = () => {
        if (mv.get() !== target) return;
        controls.current.delete(i);
        setBend(i, null);
        if (opts.land) sound.land(isRigid(i));
      };
      const c = opts.spring
        ? animate(mv, target, { ...RELEASE, velocity: opts.velocity ?? 0, onComplete })
        : animate(mv, target, {
            duration: opts.duration ?? TURN_DURATION,
            ease: TURN_EASE,
            delay: opts.delay ?? 0,
            onComplete,
          });
      controls.current.set(i, c);
    },
    [leaves, reduced, setBend, sound, strips]
  );

  const moveCamera = useCallback(
    (to: Side, opts: { velocity?: number; spring?: boolean; duration?: number } = {}) => {
      focusAnim.current?.stop();
      const v = to === "right" ? 1 : 0;
      if (reduced) {
        focus.set(v);
        return;
      }
      focusAnim.current = opts.spring
        ? animate(focus, v, { ...RELEASE, velocity: opts.velocity ?? 0 })
        : animate(focus, v, { duration: opts.duration ?? TURN_DURATION, ease: TURN_EASE });
    },
    [focus, reduced]
  );

  /* ---------------------------------------------------- navigation */

  const next = useCallback(() => {
    setTouched(true);
    const t = targetRef.current;
    if (single) {
      if (sideRef.current === "left" && t < LEAVES) {
        moveCamera("right", { duration: 0.6 });
        commit(t, "right");
        return;
      }
      if (t >= LEAVES) return;
      runFlip(t, true, { land: true });
      moveCamera("left");
      sound.turn(isRigid(t));
      commit(t + 1, "left");
      return;
    }
    if (t >= LEAVES) return;
    runFlip(t, true, { land: true });
    sound.turn(isRigid(t));
    commit(t + 1, "right");
  }, [single, moveCamera, commit, runFlip, sound]);

  const prev = useCallback(() => {
    setTouched(true);
    const t = targetRef.current;
    if (single) {
      if (sideRef.current === "right" && t > 0) {
        moveCamera("left", { duration: 0.6 });
        commit(t, "left");
        return;
      }
      if (t <= 0) return;
      runFlip(t - 1, false, { land: true });
      moveCamera("right");
      sound.turn(isRigid(t - 1));
      commit(t - 1, "right");
      return;
    }
    if (t <= 0) return;
    runFlip(t - 1, false, { land: true });
    sound.turn(isRigid(t - 1));
    commit(t - 1, "right");
  }, [single, moveCamera, commit, runFlip, sound]);

  /** Jump to a page. Several leaves riffle over in a quick cascade. */
  const goTo = useCallback(
    (seq: number) => {
      setTouched(true);
      const t = targetRef.current;
      const nt = spreadForSeq(seq);
      const ns: Side = nt === 0 ? "right" : nt === LEAVES ? "left" : sideForSeq(seq);
      if (nt !== t) {
        const fwd = nt > t;
        const order: number[] = [];
        if (fwd) for (let i = t; i < nt; i++) order.push(i);
        else for (let i = t - 1; i >= nt; i--) order.push(i);
        const n = order.length;
        const step = Math.min(0.085, 0.8 / n);
        order.forEach((i, k) =>
          runFlip(i, fwd, {
            delay: k * step,
            duration: n > 1 ? 0.75 : TURN_DURATION,
            // Pages buried mid-riffle bend with fewer strips: same look, far less work.
            strips: n > 5 && k < n - 2 ? 4 : undefined,
            land: k === n - 1,
          })
        );
        if (n > 1) sound.riffle(n);
        else sound.turn(isRigid(order[0]));
      }
      if (single) moveCamera(ns, { duration: nt !== t ? 0.8 : 0.6 });
      commit(nt, ns);
    },
    [single, runFlip, moveCamera, commit, sound]
  );

  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  useEffect(() => {
    if (deepLinkSeq === null) return;
    window.history.replaceState(null, "", "/flipbook");
    const id = window.setTimeout(() => goToRef.current(deepLinkSeq), reduced ? 0 : 1100);
    return () => window.clearTimeout(id);
  }, [deepLinkSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the camera sensible when the layout switches between modes.
  useEffect(() => {
    if (!size) return;
    const t = targetRef.current;
    const s: Side = size.mode === "spread" ? "right" : t === 0 ? "right" : t === LEAVES ? "left" : sideRef.current;
    focus.set(s === "right" ? 1 : 0);
    commit(t, s);
  }, [size?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------- corner peel */

  const unpeel = useCallback(() => {
    const pr = peelRef.current;
    if (!pr) return;
    peelRef.current = null;
    runFlip(pr.leaf, pr.rest === 1, { spring: true });
  }, [runFlip]);

  const peel = useCallback(
    (leaf: number, rest: 0 | 1) => {
      if (peelRef.current?.leaf === leaf) return;
      unpeel();
      if (bendsRef.current[leaf] || reduced) return; // already moving
      const mv = leaves[leaf];
      setBend(leaf, { dir: rest === 0 ? 1 : -1, strips: isRigid(leaf) ? 1 : strips });
      controls.current.get(leaf)?.stop();
      controls.current.set(
        leaf,
        animate(mv, rest === 0 ? PEEL : 1 - PEEL, { type: "spring", visualDuration: 0.35, bounce: 0.15 })
      );
      peelRef.current = { leaf, rest };
    },
    [leaves, reduced, setBend, strips, unpeel]
  );

  /* ---------------------------------------------------- gestures */

  const gesture = useRef<Gesture | null>(null);

  const geometry = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !size) return null;
    const r = stage.getBoundingClientRect();
    const bookLeft = single ? (size.stageW - size.boardW) / 2 : size.stageW / 2 - size.boardW;
    const bookTop = (size.stageH - size.boardH) / 2;
    const originX = r.left + bookLeft + bookX.get();
    return {
      rect: r,
      originX,
      originY: r.top + bookTop,
      spineX: originX + size.boardW,
    };
  }, [size, single, bookX]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !size) return;
    gesture.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      active: false,
      samples: [{ x: e.clientX, t: performance.now() }],
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone (e.g. a synthetic or cancelled pointer) */
    }
  };

  const beginGesture = (g: Gesture, dx: number) => {
    const geo = geometry();
    if (!geo || !size) return;
    unpeel();
    const t = targetRef.current;
    let leaf: number | null = null;
    let pan = false;
    if (single) {
      const onRight = sideRef.current === "right";
      if (onRight && dx < 0 && t < LEAVES) leaf = t;
      else if (!onRight && dx > 0 && t > 0) leaf = t - 1;
      else if (onRight ? t > 0 : t < LEAVES) pan = true;
    } else if (g.x0 >= geo.spineX && t < LEAVES) leaf = t;
    else if (g.x0 < geo.spineX && t > 0) leaf = t - 1;

    if (leaf !== null) {
      const mv = leaves[leaf];
      controls.current.get(leaf)?.stop();
      if (peelRef.current?.leaf === leaf) peelRef.current = null;
      const existing = bendsRef.current[leaf];
      setBend(leaf, {
        dir: existing?.dir ?? (mv.get() < 0.5 ? 1 : -1),
        strips: isRigid(leaf) ? 1 : strips,
      });
      focusAnim.current?.stop();
      Object.assign(g, {
        active: true,
        kind: "flip",
        leaf,
        p0: mv.get(),
        f0: focus.get(),
        span: single ? size.boardW * 0.9 : size.boardW * 1.5,
      });
      sound.turn(isRigid(leaf));
      setTouched(true);
    } else if (pan) {
      focusAnim.current?.stop();
      Object.assign(g, { active: true, kind: "pan", f0: focus.get(), span: size.boardW });
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) {
      hoverPeel(e);
      return;
    }
    if (e.pointerId !== g.id) return;
    const now = performance.now();
    g.samples.push({ x: e.clientX, t: now });
    while (g.samples.length > 2 && now - g.samples[0].t > 100) g.samples.shift();

    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.active) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.3) return;
      beginGesture(g, dx);
      if (!g.active) return;
    }
    if (g.kind === "flip" && g.leaf !== undefined) {
      const p = Math.min(1, Math.max(0, g.p0! - dx / g.span!));
      leaves[g.leaf].set(p);
      if (single) focus.set(1 - p);
    } else if (g.kind === "pan") {
      focus.set(Math.min(1, Math.max(0, g.f0! - dx / g.span!)));
    }
  };

  const endGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.id) return;
    gesture.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (!g.active) {
      if (cancelled) return;
      // A tap or click turns the page on that side.
      const geo = geometry();
      if (!geo || !size) return;
      const split = single ? geo.rect.left + size.stageW / 2 : geo.spineX;
      if (e.clientX >= split) next();
      else prev();
      return;
    }

    const s = g.samples;
    const first = s[0];
    const last = s[s.length - 1];
    const dt = (last.t - first.t) / 1000;
    const vx = dt > 0.008 ? (last.x - first.x) / dt : 0;

    if (g.kind === "flip" && g.leaf !== undefined) {
      const i = g.leaf;
      const p = leaves[i].get();
      const vp = -vx / g.span!;
      const toTurned = cancelled ? p > 0.5 : p + vp * 0.22 > 0.5;
      runFlip(i, toTurned, { spring: true, velocity: vp, land: true });
      if (single) moveCamera(toTurned ? "left" : "right", { spring: true, velocity: -vp });
      commit(toTurned ? i + 1 : i, single && toTurned ? "left" : "right");
    } else if (g.kind === "pan") {
      const f = focus.get();
      const vf = -vx / g.span!;
      const to: Side = (cancelled ? f : f + vf * 0.22) > 0.5 ? "right" : "left";
      moveCamera(to, { spring: true, velocity: vf });
      commit(targetRef.current, to);
    }
  };

  /** Lift the page corner a little when the mouse comes near it. */
  const hoverPeel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (single || e.pointerType !== "mouse" || !size || panel) return;
    const geo = geometry();
    if (!geo) return;
    const bx = e.clientX - geo.originX;
    const by = e.clientY - geo.originY;
    const { boardW: bw, boardH: bh } = size;
    const zone = Math.min(110, bw * 0.22);
    const nearY = (by > -12 && by < zone) || (by > bh - zone && by < bh + 12);
    const t = targetRef.current;
    if (nearY && t < LEAVES && bx > 2 * bw - zone && bx < 2 * bw + 16) peel(t, 0);
    else if (nearY && t > 0 && bx < zone && bx > -16) peel(t - 1, 1);
    else unpeel();
  };

  /* ---------------------------------------------------- keyboard */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (panel) {
        if (e.key === "Escape") setPanel(null);
        return;
      }
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(TOTAL_PAGES - 1);
          break;
        case "z":
          setPanel("zoom");
          break;
        case "c":
          setPanel("contents");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, panel]);

  /* ------------------------------------------------------ images */

  const tier: Tier = size && size.innerW * size.dpr > 1000 ? "hd" : "md";

  useEffect(() => {
    const urls: string[] = [];
    for (let i = spread - LOAD_WINDOW; i <= spread + LOAD_WINDOW; i++) {
      if (i < 0 || i >= LEAVES) continue;
      for (const f of [leafFront(i), leafBack(i)]) if (f.kind === "pdf") urls.push(pageImage(f.n, tier));
    }
    // Nearest first, so the pages about to be seen decode first.
    urls.forEach((u) => {
      const img = new Image();
      img.decoding = "async";
      img.src = u;
    });
  }, [spread, tier]);

  /* ------------------------------------------------------ labels */

  const visibleSeqs: number[] = single
    ? [side === "left" ? 2 * spread - 1 : 2 * spread]
    : [2 * spread - 1, 2 * spread].filter((s) => s >= 0 && s < TOTAL_PAGES);
  const anchorSeq = visibleSeqs[visibleSeqs.length - 1] ?? 0;
  const chapter = chapterForSeq(anchorSeq);
  const pageLabel =
    spread === 0
      ? "Front cover"
      : spread === LEAVES
        ? "Back cover"
        : visibleSeqs.length === 2
          ? `Pages ${visibleSeqs[0] + 1}–${visibleSeqs[1] + 1}`
          : `Page ${visibleSeqs[0] + 1}`;
  const liveText = visibleSeqs.map((s) => textForFace(SEQ[s])).join(" ");

  /* ------------------------------------------------------ render */

  const bookLeft = size ? (single ? (size.stageW - size.boardW) / 2 : size.stageW / 2 - size.boardW) : 0;
  const bookTop = size ? (size.stageH - size.boardH) / 2 : 0;
  const innerTurned = Math.min(Math.max(spread - 1, 0), LEAVES - 2);
  const edgeR = Math.min(7, (LEAVES - 2 - innerTurned) * 0.27);
  const edgeL = Math.min(7, innerTurned * 0.27);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className="fb-root">
        <Chrome
          rootRef={rootRef}
          spread={spread}
          side={side}
          single={!!single}
          pageLabel={pageLabel}
          chapter={chapter}
          chapters={CHAPTERS}
          anchorSeq={anchorSeq}
          visibleSeqs={visibleSeqs}
          panel={panel}
          setPanel={setPanel}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
          onNext={next}
          onPrev={prev}
          onGoTo={goTo}
          canPrev={spread > 0}
          canNext={spread < LEAVES}
          tier={tier}
        >
          <div
            ref={stageRef}
            className="fb-stage"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endGesture(e, false)}
            onPointerCancel={(e) => endGesture(e, true)}
            onPointerLeave={() => !gesture.current && unpeel()}
            role="region"
            aria-roledescription="flip book"
            aria-label={`The Money Tree of Life. ${pageLabel}. Use the left and right arrow keys to turn pages.`}
          >
            <div className="fb-glow" />
            {size && (
              <motion.div
                className="fb-entrance"
                initial={{ opacity: 0, y: 70, rotateX: 24, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                transition={{ type: "spring", visualDuration: 1.1, bounce: 0.12, delay: 0.1 }}
              >
                <motion.div
                  className="fb-book"
                  style={{ x: bookX, left: bookLeft, top: bookTop, width: size.boardW * 2, height: size.boardH }}
                >
                  {/* drop shadow of each half of the book on the "desk" */}
                  <motion.div
                    className="fb-ground"
                    style={{ left: 0, width: size.boardW, height: size.boardH, opacity: leftGround }}
                  />
                  <motion.div
                    className="fb-ground"
                    style={{ left: size.boardW, width: size.boardW, height: size.boardH, opacity: rightGround }}
                  />
                  {/* page-block thickness visible past each stack's fore-edge */}
                  {edgeR > 0.5 && (
                    <div
                      className="fb-edges fb-edges-r"
                      style={{ left: size.boardW + size.innerW, top: size.m + 1, width: edgeR, height: size.innerH - 2 }}
                    />
                  )}
                  {edgeL > 0.5 && spread > 0 && (
                    <div
                      className="fb-edges fb-edges-l"
                      style={{ left: size.boardW - size.innerW - edgeL, top: size.m + 1, width: edgeL, height: size.innerH - 2 }}
                    />
                  )}
                  {leaves.map((p, i) => (
                    <Leaf
                      key={i}
                      index={i}
                      p={p}
                      bend={bends[i] ?? null}
                      size={size}
                      tier={Math.abs(i - spread) <= LOAD_WINDOW ? tier : null}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
            <AnimatePresence>
              {size && spread === 0 && !touched && (
                <motion.div
                  key="hint"
                  className="fb-hint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ delay: 1.6, duration: 0.5 }}
                >
                  {single ? "Tap or swipe to open the book" : "Click, drag the cover, or press → to open"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Chrome>
        <p className="sr-only" aria-live="polite">
          {pageLabel}. {liveText}
        </p>
      </div>
    </MotionConfig>
  );
}
