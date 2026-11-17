import { useRef, useState } from "react";
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

const SHEETS = [
  {
    title: "Family Pledge",
    page: 47,
    image: "/home/page-47.webp",
    alt: "Page 47: A Letter to Parents and Caregivers, and the Money Tree Family Pledge with lines to sign.",
  },
  {
    title: "30-Day Challenge",
    page: 51,
    image: "/home/page-51.webp",
    alt: "Page 51: The 30-Day Money Tree Challenge, one small money task for each day.",
  },
  {
    title: "Certificate",
    page: 55,
    image: "/home/page-55.webp",
    alt: "Page 55: the Certificate of Financial Growth, with lines for a name, a date and a next money goal.",
  },
] as const;

/** Where each sheet lands when the fan is fully open: [x %, y %, degrees]. */
const FAN = [
  [-58, 6, -9],
  [0, -4, 0],
  [58, 6, 9],
] as const;

const pop = { type: "spring" as const, visualDuration: 0.35, bounce: 0.45 };

/**
 * The back of the book: three printed pages that fan open as you scroll in,
 * and the family pledge to say out loud together, one tap per line.
 */
export function Pages() {
  const ref = useRef<HTMLElement>(null);
  const still = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const spread = useTransform(scrollYProgress, [0.2, 0.85], [still ? 1 : 0, 1], { clamp: true });

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

        <ul className="pg-fan" aria-label="Pages from the book">
          {SHEETS.map((s, i) => (
            <Sheet key={s.page} sheet={s} i={i} spread={spread} />
          ))}
        </ul>
        <ul className="pg-legend" aria-hidden>
          {SHEETS.map((s) => (
            <li key={s.page}>
              {s.title}, page {s.page}
            </li>
          ))}
        </ul>

        <div className="pg-pledge">
          <h3 className="pg-pledge-title">The Money Tree Family Pledge</h3>
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
          <p className="pg-count" aria-live="polite">
            {done ? (
              <>
                Every line said.{" "}
                <Link href={flipbookHref(47)} className="pg-sign" onPointerEnter={prefetchFlipbook}>
                  Now sign it together on page 47
                </Link>
                .
              </>
            ) : (
              <>
                {count} of {PLEDGE.length} said
              </>
            )}
          </p>
          <motion.span
            className="pg-meter"
            aria-hidden
            initial={false}
            animate={{ scaleX: count / PLEDGE.length }}
            transition={{ type: "spring", visualDuration: 0.4, bounce: 0 }}
          />
        </div>
      </div>
    </section>
  );
}

function Sheet({
  sheet,
  i,
  spread,
}: {
  sheet: (typeof SHEETS)[number];
  i: number;
  spread: MotionValue<number>;
}) {
  const [fx, fy, fr] = FAN[i];
  const x = useTransform(spread, (v) => `${fx * v}%`);
  const y = useTransform(spread, (v) => `${fy * v + (1 - v) * (i - 1) * -2}%`);
  const rotate = useTransform(spread, (v) => fr * v + (1 - v) * (i - 1) * 2);

  return (
    <motion.li className="pg-sheet" style={{ x, y, rotate, zIndex: i === 1 ? 3 : 2 - Math.abs(i - 1) }}>
      <Link
        href={flipbookHref(sheet.page)}
        className="pg-sheet-link"
        onPointerEnter={prefetchFlipbook}
        onFocus={prefetchFlipbook}
        aria-label={`${sheet.alt} Open the book at page ${sheet.page}.`}
      >
        <motion.span
          className="pg-paper"
          whileHover={{ y: -14, rotate: i === 1 ? 0 : -fr * 0.3 }}
          whileFocus={{ y: -14 }}
          transition={{ type: "spring", visualDuration: 0.3, bounce: 0.25 }}
        >
          <img src={sheet.image} alt="" width={440} height={661} loading="lazy" decoding="async" />
        </motion.span>
      </Link>
    </motion.li>
  );
}
