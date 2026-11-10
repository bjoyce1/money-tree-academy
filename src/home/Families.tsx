import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { EXTRAS, KIT, flipbookHref } from "./content";
import { prefetchFlipbook } from "./Nav";

const follow = { type: "spring" as const, visualDuration: 0.45, bounce: 0.12 };

/** Printed page 13, the end of Chapter 2, with the active part spotlit. */
function KitPage({ active }: { active: number }) {
  const reduce = useReducedMotion();
  const box = KIT[active].box;
  // The page leans toward the pointer a little, like paper held in a hand.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-1, 1], [-6, 6]), { stiffness: 140, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-1, 1], [5, -5]), { stiffness: 140, damping: 18 });

  return (
    <div
      className="[perspective:1400px]"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set(((e.clientX - r.left) / r.width) * 2 - 1);
        py.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div className="home-paper mx-auto w-full max-w-[440px]" style={{ rotateX, rotateY, rotate: -1.5 }}>
        <img
          src="/flipbook/pages/012-md.webp"
          alt="Page 13 of the book: the end of Chapter 2, with its Money Tree Lesson, New Money Words, Renee's and Alex's tips, a Money Tree Challenge, and a Family Conversation question."
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3px]" aria-hidden>
          {/* A highlighter stroke on the paper itself: the page stays cream. */}
          <motion.div
            className="absolute left-[9%] right-[8%] rounded-md"
            initial={false}
            animate={{ top: `${box.top}%`, height: `${box.height}%` }}
            transition={reduce ? { duration: 0 } : follow}
            style={{
              background: "rgba(230,185,85,0.26)",
              mixBlendMode: "multiply",
              boxShadow: "0 0 0 2px rgba(127,83,16,0.7)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/** Phones: the tapped part, cut straight from printed page 13. */
function KitCrop({ box, label }: { box: { top: number; height: number }; label: string }) {
  // Page is 1000 x 1502; the crop spans x 8%..92% (840px) and the box's band.
  const aspect = 840 / (15.02 * box.height);
  return (
    <div
      className="relative mx-1 mb-3 mt-1 overflow-hidden rounded-md bg-[var(--paper)] shadow-[0_10px_24px_-10px_rgba(5,8,20,0.8)]"
      style={{ aspectRatio: aspect }}
    >
      <img
        src="/flipbook/pages/012-md.webp"
        alt={`${label}, as printed on page 13 of the book.`}
        loading="lazy"
        decoding="async"
        className="absolute max-w-none"
        style={{
          width: `${100 / 0.84}%`,
          left: `${-8 / 0.84}%`,
          top: `${(-100 * box.top) / box.height}%`,
        }}
      />
    </div>
  );
}

export function Families() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="families"
      aria-labelledby="families-title"
      className="scroll-mt-20 bg-[var(--night-2)] px-5 py-[clamp(5rem,10vw,8rem)] sm:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          {/* Below lg each part shows its own crop of the page inline instead. */}
          <div className="hidden lg:block">
            <KitPage active={active} />
          </div>

          <div>
            <h2
              id="families-title"
              className="home-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] text-[var(--gold)]"
            >
              Every chapter ends with something to do together
            </h2>
            <p className="home-measure mt-4 text-[clamp(1.05rem,1.4vw,1.2rem)] text-[var(--cream-2)]">
              The story stops, and the book hands the lesson to your family. This is the real end of Chapter 2.
            </p>

            <ul className="mt-8 space-y-1" aria-label="What each chapter ends with">
              {KIT.map((part, i) => {
                const on = i === active;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onPointerEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      className={`relative w-full rounded-xl px-4 py-3 text-left ${
                        on ? "bg-[rgba(230,185,85,0.09)]" : "hover:bg-[rgba(255,255,255,0.03)]"
                      }`}
                    >
                      <span
                        className={`block font-[Cinzel] text-[1.12rem] font-semibold ${
                          on ? "text-[var(--gold)]" : "text-[var(--cream)]"
                        }`}
                      >
                        {part.name}
                      </span>
                      <span className="mt-0.5 block text-[var(--cream-2)]">{part.detail}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div
                          key="crop"
                          className="overflow-hidden lg:hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", visualDuration: 0.35, bounce: 0 }}
                        >
                          <KitCrop box={part.box} label={part.name} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <figure className="mx-auto mt-[clamp(4rem,8vw,6.5rem)] max-w-[880px] text-center">
          <blockquote className="text-[clamp(1.5rem,2.8vw,2.3rem)] italic leading-[1.4] tracking-[-0.005em] text-[var(--cream)] [text-wrap:balance]">
            “You do not need to be a banker, investor, accountant, or financial expert. You only need to be
            willing to begin.”
          </blockquote>
          <figcaption className="mt-5 text-[var(--cream-3)]">From the book’s letter to parents and caregivers</figcaption>
        </figure>
        <p className="home-measure mx-auto mt-6 text-center text-[var(--cream-2)]">
          Shame-free by design: families can use pretend numbers, and no child is ever asked to share real income,
          debt, or hardship.
        </p>

        <div className="mt-[clamp(4rem,8vw,6rem)]">
          <h3 className="home-display text-[clamp(1.4rem,2.2vw,1.75rem)] text-[var(--cream)]">Also in the book</h3>
          <ul className="home-strip -mx-5 mt-6 flex gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {EXTRAS.map((x) => (
              <li key={x.page} className="w-[42vw] max-w-[200px] flex-none lg:w-auto lg:max-w-none">
                <Link
                  href={flipbookHref(x.page)}
                  className="group block rounded-lg"
                  onPointerEnter={prefetchFlipbook}
                  onFocus={prefetchFlipbook}
                >
                  <motion.span
                    className="block overflow-hidden rounded-[3px] bg-[var(--paper)] shadow-[0_18px_36px_-14px_rgba(5,8,20,0.8)]"
                    whileHover={{ y: -6, rotate: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", visualDuration: 0.3, bounce: 0.25 }}
                  >
                    <img
                      src={x.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-[2/3] w-full object-cover"
                    />
                  </motion.span>
                  <span className="mt-3 block font-bold leading-snug text-[var(--cream)] group-hover:text-[var(--gold)]">
                    {x.title}
                  </span>
                  <span className="text-[0.9rem] text-[var(--cream-3)]">Page {x.page}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
