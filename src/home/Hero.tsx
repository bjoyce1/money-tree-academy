import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown } from "lucide-react";
import { OpenBookButton } from "./Nav";

const settle = { type: "spring" as const, visualDuration: 0.9, bounce: 0 };

/**
 * The cover, made live: the art band from the book cover with its painted
 * title replaced by real type, set where the cover sets it.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Scrolling away: the art sinks slowly and grows a touch, the type lifts
  // and fades faster, so the two separate like layers.
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160]);
  const artScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.07]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { ...settle, delay },
        };

  return (
    <section ref={ref} id="top" className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero-ambient" aria-hidden />

      <motion.div className="home-hero-art" style={{ y: artY, scale: artScale }}>
        <motion.img
          src="/home/cover-hero.webp"
          srcSet="/home/cover-hero.webp 1024w, /home/cover-hero@2x.webp 1600w"
          sizes="(min-aspect-ratio: 1/1) 95vh, 100vw"
          alt="Renee and Alex, arms crossed, standing in front of the glowing Money Tree."
          // React 18 only passes the lowercase HTML attribute through.
          {...{ fetchpriority: "high" }}
          initial={reduce ? false : { opacity: 0, scale: 1.05, filter: "blur(18px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", visualDuration: 1.5, bounce: 0 }}
        />
      </motion.div>
      <div className="home-hero-scrim" aria-hidden />

      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative mx-auto flex h-full max-w-[1100px] flex-col items-center px-5 pb-[clamp(1.75rem,6vh,4rem)] pt-[clamp(5.25rem,10.5vh,7.5rem)] text-center"
      >
        <h1 id="hero-title" className="home-display home-title-shadow text-[var(--gold)]">
          <motion.span
            className="block text-[clamp(1.15rem,2.2vw,1.9rem)] font-semibold tracking-[0.18em] text-[var(--cream)]"
            {...rise(0.15)}
          >
            The
          </motion.span>
          <motion.span
            className="mt-1 block text-[clamp(2.6rem,6.4vw,5.6rem)] leading-[1.02]"
            {...rise(0.25)}
          >
            Money Tree of Life
          </motion.span>
        </h1>

        <motion.div className="mt-4 flex w-full max-w-[560px] items-center gap-4" {...rise(0.4)}>
          <span className="home-rule flex-1" />
          <p className="home-title-shadow whitespace-nowrap text-[clamp(0.72rem,1.15vw,0.95rem)] font-bold uppercase tracking-[0.2em] text-[var(--cream)]">
            Growing financial literacy for kids
          </p>
          <span className="home-rule flex-1" />
        </motion.div>

        {/* Where the cover prints the author's banner, the page puts its action. */}
        <div className="mt-auto flex flex-col items-center">
          <motion.p
            className="home-title-shadow max-w-[34rem] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.55] text-[var(--cream)]"
            {...rise(0.55)}
          >
            Renee and Alex follow a golden leaf to a tree that never hands out money. It teaches them to grow it.
          </motion.p>
          <motion.div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3" {...rise(0.68)}>
            <OpenBookButton />
            <a
              href="#chapters"
              className="group inline-flex min-h-[3.25rem] items-center gap-2 rounded-full px-3 font-bold text-[var(--cream)] hover:text-[var(--gold)]"
            >
              See the chapters
              <ArrowDown size={18} aria-hidden />
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
