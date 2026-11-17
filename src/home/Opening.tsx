import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BookOpen } from "lucide-react";
import { flipbookHref } from "@/flipbook/chapters";
import { prefetchFlipbook } from "./Nav";
import { ENDPAPER_PATTERN, GoldLeaf, Skyline } from "./Art";

/** Printed page of the book's Answer Key and Educator Notes. */
const EDUCATOR_PAGE = 53;

const press = { type: "spring" as const, visualDuration: 0.18, bounce: 0 };

function useWide() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/**
 * The opening. The book rests on a night over Houston. Scroll, and the words
 * step back, the book turns to face you, its cover swings open, and Chapter 1's
 * painting grows until you are standing in it. The golden leaf lifts off the
 * cover and leads the way down.
 *
 * One scroll position drives everything: a few CSS variables (--move, --open,
 * --zoom, --copy) set on the section, which home.css turns into transforms for
 * each breakpoint. The resting layout is plain HTML in index.html, so it is on
 * screen before any script runs; keep the two in step.
 */
export function Opening() {
  const ref = useRef<HTMLElement>(null);
  const still = !!useReducedMotion();
  const wide = useWide();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const copy = useTransform(p, [0.02, 0.24], [0, 1], { clamp: true });
  const move = useTransform(p, [0.08, 0.4], [0, 1], { clamp: true });
  const open = useTransform(p, [0.26, 0.58], [0, 1], { clamp: true });
  const zoom = useTransform(p, [0.62, 0.96], [0, 1], { clamp: true });
  const skyY = useTransform(p, [0, 1], ["0svh", "7svh"]);

  // The leaf: lifted by the opening cover, it drifts across the spread and
  // away down the page.
  const leafX = useTransform(
    p,
    [0, 0.2, 0.42, 0.62, 0.98],
    wide ? ["0vw", "-3vw", "-22vw", "-36vw", "-58vw"] : ["0vw", "-4vw", "-18vw", "-30vw", "-44vw"],
  );
  const leafY = useTransform(
    p,
    [0, 0.2, 0.42, 0.62, 0.98],
    wide ? ["0svh", "-8svh", "-13svh", "-12svh", "62svh"] : ["0svh", "-6svh", "-9svh", "-8svh", "54svh"],
  );
  const leafR = useTransform(p, [0, 0.2, 0.42, 0.62, 0.98], [0, -24, 38, -18, 70]);

  // Hidden copy must not be clickable.
  const [copyGone, setCopyGone] = useState(false);
  useMotionValueEvent(copy, "change", (v) => setCopyGone(v > 0.96));

  const vars = still ? undefined : ({ "--copy": copy, "--move": move, "--open": open, "--zoom": zoom } as Record<string, unknown>);

  return (
    <motion.section ref={ref} id="top" className="op" aria-labelledby="hero-title" style={vars as never}>
      <div className="op-stage">
        <motion.div className="op-sky" style={still ? undefined : { y: skyY }} aria-hidden>
          <Skyline className="op-skyline" />
        </motion.div>

        <div className="op-copy" style={{ visibility: !still && copyGone ? "hidden" : undefined }}>
          <h1 id="hero-title" className="op-title">
            <span>Money does not grow on trees.</span> <span className="op-title-gold">Knowledge does.</span>
          </h1>
          <p className="op-sub">
            <strong>The Money Tree of Life</strong> is a story for kids 8 to 15 and their families.
            <span className="op-sub-more"> Renee and Alex follow a golden leaf to a tree that teaches them to earn, save, budget and build.</span>
          </p>
          <div className="op-actions">
            <Link href="/flipbook" className="op-btn-wrap" onPointerEnter={prefetchFlipbook} onFocus={prefetchFlipbook} data-testid="hero-read">
              <motion.span className="home-btn home-btn-gold op-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97, y: 0 }} transition={press}>
                <BookOpen size={19} strokeWidth={2} aria-hidden />
                Read the book
              </motion.span>
            </Link>
          </div>
          <p className="op-meta">
            <span>By Cornelius A. Pratt</span>
            <Link href={flipbookHref(EDUCATOR_PAGE)} className="home-link" data-testid="hero-educators">
              For educators: answer key and notes
            </Link>
          </p>
        </div>

        <div className="op-book-stage">
          <Link href="/flipbook" className="op-book" onPointerEnter={prefetchFlipbook} onFocus={prefetchFlipbook} aria-label="Read the book: The Money Tree of Life">
            <span className="op-page">
              <img
                src="/home/chapters/chapter-1-640.webp"
                srcSet="/home/chapters/chapter-1-640.webp 640w, /home/chapters/chapter-1-1100.webp 1100w"
                sizes="(min-width: 900px) 50vw, 100vw"
                width={640}
                height={828}
                alt=""
                loading="eager"
              />
            </span>
            <span className="op-pages-edge" aria-hidden />
            <span className="op-cover">
              <span className="op-cover-front">
                <img
                  src="/home/book-cover-480.webp"
                  srcSet="/home/book-cover-480.webp 480w, /home/book-cover-960.webp 960w"
                  sizes="(min-width: 900px) 360px, 46vw"
                  width={480}
                  height={720}
                  alt="The cover of The Money Tree of Life by Cornelius A. Pratt: Renee and Alex stand in front of the glowing Money Tree."
                  {...{ fetchpriority: "high" }}
                />
              </span>
              <span className="op-cover-back" style={{ backgroundImage: ENDPAPER_PATTERN }} aria-hidden>
                <span className="op-endpaper-plate">
                  <GoldLeaf size={34} />
                  <span>Plant knowledge today. Harvest freedom tomorrow.</span>
                </span>
              </span>
            </span>
          </Link>
        </div>

        {!still && (
          <motion.span className="op-leaf" style={{ x: leafX, y: leafY, rotate: leafR }} aria-hidden>
            <GoldLeaf size={wide ? 46 : 34} />
          </motion.span>
        )}
      </div>
    </motion.section>
  );
}
