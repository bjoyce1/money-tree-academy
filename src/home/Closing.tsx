import { Link } from "wouter";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { BookOpen } from "lucide-react";
import { prefetchFlipbook } from "./Nav";
import { GoldLeaf, Skyline } from "./Art";

const press = { type: "spring" as const, visualDuration: 0.18, bounce: 0 };

/**
 * The close: back to the night over Houston. The book is shut again, and the
 * golden leaf that led the way down the page floats in and settles on it,
 * the way the page began.
 */
export function Closing() {
  const still = !!useReducedMotion();
  // Watch the book, not the leaf: the leaf starts out of view.
  const bookRef = useRef<HTMLAnchorElement>(null);
  const seen = useInView(bookRef, { once: true, amount: 0.5 });
  const land = still
    ? {}
    : {
        initial: { x: -150, y: -300, rotate: -70, opacity: 0 },
        animate: seen
          ? { x: [-150, 60, -40, 0], y: [-300, -200, -90, 0], rotate: [-70, 35, -25, 0], opacity: [0, 1, 1, 1] }
          : { x: -150, y: -300, rotate: -70, opacity: 0 },
        transition: { duration: 2.6, times: [0, 0.35, 0.7, 1], ease: [0.33, 0, 0.2, 1] as const },
      };

  return (
    <section aria-labelledby="close-title" className="cl">
      <Skyline className="cl-skyline" />
      <div className="cl-inner">
        <div className="cl-text">
          <h2 id="close-title" className="cl-title">
            Your future tree begins with what you plant today.
          </h2>
          <p className="cl-sub">Every good choice is a seed.</p>
          <div className="op-actions cl-actions">
            <Link href="/flipbook" className="op-btn-wrap" onPointerEnter={prefetchFlipbook} onFocus={prefetchFlipbook}>
              <motion.span className="home-btn home-btn-gold op-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.97, y: 0 }} transition={press}>
                <BookOpen size={19} strokeWidth={2} aria-hidden />
                Read the book
              </motion.span>
            </Link>
          </div>
        </div>

        <Link ref={bookRef} href="/flipbook" className="cl-book" onPointerEnter={prefetchFlipbook} aria-label="Read the book: The Money Tree of Life" tabIndex={-1}>
          <img
            src="/home/book-cover-480.webp"
            srcSet="/home/book-cover-480.webp 480w, /home/book-cover-960.webp 960w"
            sizes="(min-width: 900px) 300px, 52vw"
            width={480}
            height={720}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <motion.span className="cl-leaf" aria-hidden {...land}>
            <GoldLeaf size={40} />
          </motion.span>
        </Link>
      </div>
    </section>
  );
}

const footLink = "text-[var(--cream-2)] hover:text-[var(--gold)]";

export function HomeFooter() {
  return (
    <footer className="border-t border-[rgba(230,185,85,0.14)] px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <p className="home-display text-[1.15rem] text-[var(--gold)]">The Money Tree of Life</p>
          <p className="mt-1 text-[var(--cream-2)]">By Cornelius A. Pratt</p>
          <p className="mt-6 max-w-[52ch] text-[0.875rem] leading-[1.6] text-[var(--cream-3)]">
            This book is for educational purposes. It does not provide personal financial, legal, tax, or
            investment advice. Children should use banking, payment, and investing tools only with a trusted
            adult.
          </p>
          <p className="mt-4 text-[0.875rem] text-[var(--cream-3)]">© 2026 Capism Publishing</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-3 self-start text-[1.0625rem]">
          <Link href="/flipbook" className={footLink}>
            Flip book
          </Link>
          <Link href="/read" className={footLink}>
            Interactive reader
          </Link>
          <Link href="/read/glossary" className={footLink}>
            Glossary
          </Link>
          <Link href="/read/search" className={footLink}>
            Search
          </Link>
          <Link href="/characters" className={footLink}>
            Characters
          </Link>
          <Link href="/dashboard" className={footLink}>
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
