import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { flipbookHref } from "./content";
import { prefetchFlipbook } from "./Nav";
import { GoldLeaf } from "./Art";

/** The Money Tree Family Pledge, as printed on page 47. */
const PLEDGE = [
  "Talk about money without shame",
  "Ask questions when we do not understand",
  "Learn from mistakes",
  "Take care of needs before wants",
  "Save before we spend",
  "Give every dollar a job",
  "Protect our money and information",
  "Borrow carefully",
  "Invest with patience and knowledge",
  "Build value through honest work",
  "Give with purpose and respect",
  "Teach what we learn",
  "Create opportunities for the next generation",
];

type SheetKind = "pledge" | "challenge" | "certificate";

const SHEETS: { kind: SheetKind; title: string; line: string; page: number }[] = [
  {
    kind: "pledge",
    title: "The Money Tree Family Pledge",
    line: "Promises to say out loud together, then sign.",
    page: 47,
  },
  {
    kind: "challenge",
    title: "The 30-Day Money Tree Challenge",
    line: "One small money task for each day.",
    page: 51,
  },
  {
    kind: "certificate",
    title: "Certificate of Financial Growth",
    line: "To sign when the book is done, with your next money goal.",
    page: 55,
  },
];

/** Where each card lands when the fan is fully open: [x %, y %, degrees]. */
const FAN = [
  [-106, 7, -6],
  [0, -3, 0],
  [106, 7, 6],
] as const;

const pop = { type: "spring" as const, visualDuration: 0.35, bounce: 0.45 };

function useWide() {
  const query = "(min-width: 900px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/**
 * The back of the book: three keepsake pages dealt out as you scroll in,
 * and the family pledge to say out loud together. Each line grows a leaf.
 */
export function Pages() {
  const ref = useRef<HTMLElement>(null);
  const still = !!useReducedMotion();
  const wide = useWide();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const spread = useTransform(scrollYProgress, [0.25, 0.9], [still ? 1 : 0, 1], { clamp: true });

  const [said, setSaid] = useState<boolean[]>(() => PLEDGE.map(() => false));
  const count = said.filter(Boolean).length;
  const done = count === PLEDGE.length;

  return (
    <section ref={ref} className="pg" aria-labelledby="pages-title">
      <div className="pg-inner">
        <div className="pg-head">
          <p className="pg-kicker">
            <GoldLeaf size={20} />
            At the back of the book
          </p>
          <h2 id="pages-title" className="pg-title">
            Made to be used at home
          </h2>
          <p className="pg-lead">
            A family pledge, a 30-day challenge with one small step for each day, and a certificate to sign when the
            book is done.
          </p>
        </div>

        <ul className={`pg-fan${wide ? " pg-fan-wide" : ""}`} aria-label="Pages from the back of the book">
          {SHEETS.map((s, i) => (
            <Sheet key={s.page} sheet={s} i={i} spread={spread} wide={wide} />
          ))}
        </ul>

        <div className="pg-pledge" aria-labelledby="pledge-title">
          <p className="keep-tab">
            <GoldLeaf size={18} />
            Page 47
          </p>
          <h3 id="pledge-title" className="pg-pledge-title">
            The Money Tree Family Pledge
          </h3>
          <p className="pg-pledge-how">Read each line out loud together, then tap it.</p>
          <ul className="pg-lines">
            {PLEDGE.map((line, i) => (
              <li key={line}>
                <button
                  type="button"
                  className="pg-line"
                  aria-pressed={said[i]}
                  onClick={() => setSaid((s) => s.map((v, j) => (j === i ? !v : v)))}
                >
                  <span className="pg-mark" aria-hidden>
                    <AnimatePresence initial={false}>
                      {said[i] && (
                        <motion.span
                          key="leaf"
                          className="pg-mark-leaf"
                          initial={{ scale: 0, rotate: -50 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 30, transition: { duration: 0.12 } }}
                          transition={pop}
                        >
                          <GoldLeaf size={22} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span>{line}</span>
                </button>
              </li>
            ))}
          </ul>

          <Branch said={said} />
          <p className="sr-only" aria-live="polite">
            {done ? "Every line said." : `${count} of ${PLEDGE.length} lines said.`}
          </p>
          <p className="pg-done">
            {done ? (
              <>
                Every line said.{" "}
                <Link href={flipbookHref(47)} className="pg-sign" onPointerEnter={prefetchFlipbook}>
                  Now sign it together on page 47
                </Link>
                .
              </>
            ) : (
              "Every line you say grows a leaf on the branch."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- the branch */

const STEM_Y = (t: number) => 50 + 16 * Math.sin(t * Math.PI * 2.2 + 0.4);
const STEM = Array.from({ length: 61 }, (_, k) => {
  const t = k / 60;
  return `${k ? "L" : "M"}${(2 + t * 96).toFixed(2)} ${STEM_Y(t).toFixed(2)}`;
}).join(" ");

/** A thin branch with one bud per pledge line; each line said opens its bud into a golden leaf. */
function Branch({ said }: { said: boolean[] }) {
  const n = said.length;
  return (
    <div className="pg-branch" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pg-stem">
        <path d={STEM} vectorEffect="non-scaling-stroke" />
      </svg>
      {said.map((on, i) => {
        const t = (i + 0.5) / n;
        const up = i % 2 === 0;
        return (
          <span
            key={i}
            className="pg-bud"
            style={{ left: `${2 + t * 96}%`, top: `${STEM_Y(t)}%`, rotate: up ? "0deg" : "90deg" }}
          >
            <AnimatePresence initial={false}>
              {on && (
                <motion.span
                  key="leaf"
                  className="pg-bud-leaf"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, transition: { duration: 0.12 } }}
                  transition={pop}
                >
                  <GoldLeaf size={30} />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ the cards */

function Sheet({
  sheet,
  i,
  spread,
  wide,
}: {
  sheet: (typeof SHEETS)[number];
  i: number;
  spread: MotionValue<number>;
  wide: boolean;
}) {
  const [fx, fy, fr] = FAN[i];
  const x = useTransform(spread, (v) => `${fx * v}%`);
  const y = useTransform(spread, (v) => `${fy * v + (1 - v) * (i - 1) * -3}%`);
  const rotate = useTransform(spread, (v) => fr * v + (1 - v) * (i - 1) * 3);
  const tilt = (i - 1) * 1.5;

  return (
    <motion.li
      className="pg-sheet"
      style={wide ? { x, y, rotate, zIndex: i === 1 ? 3 : 2 } : { rotate: tilt }}
    >
      <Link
        href={flipbookHref(sheet.page)}
        className="pg-sheet-link"
        onPointerEnter={prefetchFlipbook}
        onFocus={prefetchFlipbook}
      >
        <motion.span
          className="keep"
          whileHover={{ y: -12 }}
          transition={{ type: "spring", visualDuration: 0.3, bounce: 0.25 }}
        >
          <span className="keep-tab">
            <GoldLeaf size={16} />
            Page {sheet.page}
          </span>
          <span className="keep-title">{sheet.title}</span>
          <span className="keep-line">{sheet.line}</span>
          <span className="keep-art" aria-hidden>
            <SheetArt kind={sheet.kind} />
          </span>
          <span className="keep-open">
            Open in the book <span aria-hidden>→</span>
          </span>
        </motion.span>
      </Link>
    </motion.li>
  );
}

/** A small drawing of what each page asks you to do, from the page's own labels. */
function SheetArt({ kind }: { kind: SheetKind }) {
  if (kind === "pledge") {
    return (
      <span className="art-sign">
        {["Child", "Parent or caregiver", "Date"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </span>
    );
  }
  if (kind === "challenge") {
    return (
      <span className="art-days">
        {Array.from({ length: 30 }, (_, d) => (
          <span key={d} data-first={d === 0 || undefined}>
            {d + 1}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="art-cert">
      <span className="art-cert-small">This certifies that</span>
      <span className="art-cert-name" />
      <span className="art-cert-seal">
        <GoldLeaf size={26} />
      </span>
    </span>
  );
}
