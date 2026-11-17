import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { INDEX, flipbookHref, type IndexEntry } from "./content";
import { prefetchFlipbook } from "./Nav";
import { GoldLeaf } from "./Art";

/** Chapters 2 to 12 and the epilogue: Chapter 1 has its own scene above. */
const STOPS = INDEX.slice(1);

/** The golden path's height band, in px, under the cards. */
const BAND = 96;
const PATH_MID = 46;
const PATH_AMP = 16;
const PATH_PERIOD = 520;

const pathY = (x: number) => PATH_MID + PATH_AMP * Math.sin((2 * Math.PI * x) / PATH_PERIOD);
const pathAngle = (x: number) =>
  (Math.atan(((PATH_AMP * 2 * Math.PI) / PATH_PERIOD) * Math.cos((2 * Math.PI * x) / PATH_PERIOD)) * 180) / Math.PI;

function pathD(width: number) {
  let d = `M 0 ${pathY(0).toFixed(1)}`;
  for (let x = 16; x <= width + 16; x += 16) d += ` L ${x} ${pathY(x).toFixed(1)}`;
  return d;
}

const lift = { type: "spring" as const, visualDuration: 0.3, bounce: 0.2 };

/**
 * The journey. Scrolling down carries you sideways along the story: the
 * section pins, the chapters travel past, and the golden path from the
 * paintings draws itself under them with the leaf riding its tip. Each
 * painting drifts inside its frame as it passes, so the row has depth.
 *
 * With reduced motion it is a plain row you can swipe or scroll sideways.
 */
export function Journey() {
  const still = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ track: 0, vw: 0, vh: 0 });
  const [centers, setCenters] = useState<number[]>([]);
  const vwRef = useRef(0);
  const trackWRef = useRef(0);
  const centersRef = useRef<number[]>([]);
  const dist = useMotionValue(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const measure = () => {
      const t = track.scrollWidth;
      const vw = stage.clientWidth;
      const vh = window.innerHeight;
      vwRef.current = vw;
      trackWRef.current = t;
      dist.set(Math.max(0, t - vw));
      setSize({ track: t, vw, vh });
      const cs = Array.from(track.querySelectorAll<HTMLElement>("[data-stop]")).map((el) => el.offsetLeft + el.offsetWidth / 2);
      centersRef.current = cs;
      setCenters(cs);
      p.set(p.get()); // re-run the transforms with the new sizes
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(stage);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [dist, still]);

  // Load every painting once the section is close, so none arrive blank.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(() => -p.get() * dist.get());
  // The path's tip sits under the middle of the screen.
  const tip = useTransform(() => -x.get() + vwRef.current / 2);
  const tipY = useTransform(tip, (t) => pathY(t) - 22);
  const tipR = useTransform(tip, (t) => pathAngle(t) - 30);
  const clip = useTransform(tip, (t) => `inset(0 ${Math.max(0, trackWRef.current - t)}px 0 0)`);

  // Keyboard: a focused card is brought to the middle by scrolling the page.
  const bringIntoView = (i: number) => {
    if (still) return;
    const section = sectionRef.current;
    const c = centers[i];
    if (!section || c === undefined || dist.get() === 0) return;
    const want = Math.min(Math.max(c - size.vw / 2, 0), dist.get());
    const top = section.getBoundingClientRect().top + window.scrollY + (want / dist.get()) * (section.offsetHeight - size.vh);
    // The page scrolls smoothly, and the browser's own scroll to the focused
    // card would animate past ours. Make it instant, then move once it is done.
    const html = document.documentElement;
    html.style.scrollBehavior = "auto";
    requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
      requestAnimationFrame(() => (html.style.scrollBehavior = ""));
    });
  };

  const height = still || !size.track ? undefined : size.track - size.vw + size.vh;

  return (
    <section
      ref={sectionRef}
      id="chapters"
      className="jr"
      aria-labelledby="chapters-title"
      style={{ height }}
      data-still={still || undefined}
    >
      <div ref={stageRef} className="jr-stage">
        <motion.div ref={trackRef} className="jr-track" style={still ? undefined : { x }}>
          <div className="jr-intro">
            <p className="jr-kicker">
              <GoldLeaf size={20} />
              The rest of the story
            </p>
            <h2 id="chapters-title" className="jr-title">
              Twelve chapters. One golden leaf.
            </h2>
            <p className="jr-lead">
              Each chapter turns a moment in the story into one lesson your family can use. Choose a chapter to open
              the book there.
            </p>
            {!still && (
              <p className="jr-hint" aria-hidden>
                Keep scrolling
                <ArrowRight size={16} />
              </p>
            )}
          </div>

          <ol className="jr-list">
            {STOPS.map((c, i) => (
              <Stop key={c.number} c={c} x={x} index={i} centersRef={centersRef} vwRef={vwRef} near={near} onFocus={() => bringIntoView(i)} still={still} />
            ))}
          </ol>

          <div className="jr-end">
            <p className="jr-end-line">That is the whole story. The next chapter is yours.</p>
            <Link href="/flipbook" className="op-btn-wrap" onPointerEnter={prefetchFlipbook} onFocus={() => { prefetchFlipbook(); bringIntoView(STOPS.length - 1); }}>
              <motion.span className="home-btn home-btn-gold op-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={lift}>
                <BookOpen size={19} strokeWidth={2} aria-hidden />
                Read the book
              </motion.span>
            </Link>
          </div>

          {!still && size.track > 0 && (
            <div className="jr-band" aria-hidden style={{ width: size.track }}>
              <svg width={size.track} height={BAND} className="jr-path">
                <path d={pathD(size.track)} className="jr-path-faint" />
                {centers.map((cx, i) => (
                  <circle key={i} cx={cx} cy={pathY(cx)} r={5} className="jr-node" />
                ))}
              </svg>
              <motion.svg width={size.track} height={BAND} className="jr-path" style={{ clipPath: clip }}>
                <path d={pathD(size.track)} className="jr-path-lit" />
                {centers.map((cx, i) => (
                  <circle key={i} cx={cx} cy={pathY(cx)} r={5} className="jr-node-lit" />
                ))}
              </motion.svg>
              <motion.span className="jr-leaf" style={{ x: tip, y: tipY, rotate: tipR }}>
                <GoldLeaf size={40} />
              </motion.span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Stop({
  c,
  x,
  index,
  centersRef,
  vwRef,
  near,
  onFocus,
  still,
}: {
  c: IndexEntry;
  x: MotionValue<number>;
  index: number;
  centersRef: React.MutableRefObject<number[]>;
  vwRef: React.MutableRefObject<number>;
  near: boolean;
  onFocus: () => void;
  still: boolean;
}) {
  // The painting slides inside its frame as the card passes the middle.
  const imgX = useTransform(x, (v) => {
    const center = centersRef.current[index];
    if (center === undefined) return 0;
    const off = center + v - vwRef.current / 2;
    return Math.max(-10, Math.min(10, off * -0.03));
  });
  const name = c.number === "E" ? "Epilogue" : `Chapter ${c.number}`;

  return (
    <li className="jr-stop" data-stop>
      <Link
        href={flipbookHref(c.page)}
        className="jr-card"
        onPointerEnter={prefetchFlipbook}
        onFocus={() => {
          prefetchFlipbook();
          onFocus();
        }}
        aria-label={`${name}: ${c.title}. Open the book at page ${c.page}.`}
      >
        <motion.span className="jr-card-inner" whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} transition={lift}>
          <span className="jr-frame">
            <motion.img
              src={c.image}
              alt={c.alt}
              width={720}
              height={931}
              loading={near ? "eager" : "lazy"}
              decoding="async"
              style={still ? undefined : { x: imgX }}
            />
          </span>
          <span className="jr-meta">
            <span className="jr-num">{c.number === "E" ? "Epilogue" : c.number}</span>
            <span className="jr-page">
              Page {c.page}
              <ArrowUpRight size={16} aria-hidden />
            </span>
          </span>
          <span className="jr-name">{c.title}</span>
          <span className="jr-lesson">{c.lesson}</span>
        </motion.span>
      </Link>
    </li>
  );
}
