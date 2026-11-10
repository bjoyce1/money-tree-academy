import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Leaf } from "lucide-react";
import { INDEX, flipbookHref } from "./content";
import { prefetchFlipbook } from "./Nav";

const reveal = { type: "spring" as const, visualDuration: 0.65, bounce: 0 };

/**
 * The signature: the book's contents as the page's spine. A plate beside the
 * list shows the active chapter's illustration; a row is active while it is
 * hovered or focused, otherwise while it crosses the reading line.
 */
export function ChapterIndex() {
  const [active, setActive] = useState(0);
  const pointerInside = useRef(false);
  const rows = useRef<(HTMLAnchorElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Scroll drives the plate when the pointer isn't choosing.
  useEffect(() => {
    const els = rows.current.filter(Boolean) as HTMLAnchorElement[];
    const io = new IntersectionObserver(
      (entries) => {
        if (pointerInside.current) return;
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Fetch the chapter art once the section is close, so swaps are instant.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        INDEX.forEach((c) => {
          const img = new Image();
          img.decoding = "async";
          img.src = c.image;
        });
        io.disconnect();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = INDEX[active];

  return (
    <section
      ref={sectionRef}
      id="chapters"
      aria-labelledby="chapters-title"
      className="scroll-mt-20 px-5 pb-[clamp(5rem,10vw,8rem)] sm:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2 id="chapters-title" className="home-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] text-[var(--gold)]">
          Inside the book
        </h2>
        <p className="home-measure mt-4 text-[clamp(1.05rem,1.4vw,1.2rem)] text-[var(--cream-2)]">
          Twelve chapters and an epilogue. Each one turns a moment in the story into a lesson your family can
          use. Choose any chapter to open the book there.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {/* The plate: desktop only, sticky beside the list. */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="home-plate">
                <AnimatePresence initial={false}>
                  <motion.img
                    key={current.image}
                    src={current.image}
                    alt={current.alt}
                    initial={reduce ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 }}
                    animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.25 } }}
                    transition={reveal}
                  />
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={current.number}
                  className="mt-4 text-[0.875rem] text-[var(--cream-3)]"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {current.number === "E" ? "Epilogue" : `Chapter ${current.number}`} opens on page {current.page}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <ol
            className="border-b border-[rgba(230,185,85,0.18)]"
            onPointerEnter={() => (pointerInside.current = true)}
            onPointerLeave={() => (pointerInside.current = false)}
          >
            {INDEX.map((c, i) => {
              const isActive = i === active;
              return (
                <li key={c.number}>
                  <Link
                    href={flipbookHref(c.page)}
                    ref={(el: HTMLAnchorElement | null) => (rows.current[i] = el)}
                    data-index={i}
                    data-active={isActive}
                    className="home-row group"
                    onPointerEnter={() => {
                      setActive(i);
                      prefetchFlipbook();
                    }}
                    onFocus={() => {
                      setActive(i);
                      prefetchFlipbook();
                    }}
                    aria-label={`${c.number === "E" ? "Epilogue" : `Chapter ${c.number}`}: ${c.title}. Open the book at page ${c.page}.`}
                  >
                    <span className="home-row-num relative" aria-hidden>
                      {/* The story's golden leaf travels to the chapter being read. */}
                      {isActive && (
                        <motion.span
                          layoutId="home-row-leaf"
                          className="pointer-events-none absolute -left-[1.15rem] top-[0.45rem] text-[var(--gold)] sm:-left-6"
                          transition={{ type: "spring", visualDuration: 0.4, bounce: 0.15 }}
                        >
                          <Leaf size={14} strokeWidth={2.25} fill="currentColor" />
                        </motion.span>
                      )}
                      {c.number}
                    </span>
                    <span className="flex min-w-0 gap-4">
                      <img
                        src={c.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-[72px] w-[56px] flex-none rounded-md object-cover lg:hidden"
                      />
                      <span className="min-w-0">
                        <span className="home-row-title block">{c.title}</span>
                        <span className="mt-1.5 block text-[1.0625rem] leading-[1.55] text-[var(--cream-2)]">
                          {c.lesson}
                        </span>
                      </span>
                    </span>
                    <span className="home-row-page flex items-center gap-1.5">
                      <span className="hidden sm:inline">p.&nbsp;{c.page}</span>
                      <motion.span
                        animate={{ x: isActive ? 2 : 0, y: isActive ? -2 : 0, opacity: isActive ? 1 : 0.45 }}
                        transition={{ type: "spring", visualDuration: 0.25, bounce: 0.2 }}
                        className="text-[var(--gold)]"
                      >
                        <ArrowUpRight size={18} aria-hidden />
                      </motion.span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
