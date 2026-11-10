import { Link } from "wouter";
import { motion, useScroll, useTransform } from "motion/react";
import { BookOpen } from "lucide-react";

/** Warm the lazily loaded flip book as soon as someone shows intent. */
let prefetched = false;
export const prefetchFlipbook = () => {
  if (prefetched) return;
  prefetched = true;
  void import("@/pages/FlipBookPage");
};

const press = { type: "spring" as const, visualDuration: 0.18, bounce: 0 };

/** The one primary action on the page: open the flip book. */
export function OpenBookButton({ href = "/flipbook", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-full"
      onPointerEnter={prefetchFlipbook}
      onFocus={prefetchFlipbook}
      data-testid="button-open-flipbook"
    >
      <motion.span
        className={`home-btn home-btn-gold ${compact ? "!min-h-[2.5rem] !px-4 !text-[0.875rem]" : ""}`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={press}
      >
        <BookOpen size={compact ? 17 : 19} strokeWidth={2} aria-hidden />
        Open the book
      </motion.span>
    </Link>
  );
}

const navLink =
  "rounded-full px-3 py-2 text-[1.0625rem] text-[var(--cream-2)] hover:text-[var(--gold)]";

export function HomeNav() {
  const { scrollY } = useScroll();
  // The bar materialises as content starts to pass beneath it.
  const backgroundColor = useTransform(scrollY, [0, 220], ["rgba(11,18,36,0)", "rgba(11,18,36,0.8)"]);
  const borderBottomColor = useTransform(scrollY, [0, 220], ["rgba(230,185,85,0)", "rgba(230,185,85,0.14)"]);
  const backdropFilter = useTransform(scrollY, [0, 220], ["blur(0px) saturate(100%)", "blur(16px) saturate(140%)"]);

  return (
    <motion.header
      className="home-nav-solid fixed inset-x-0 top-0 z-40 border-b"
      style={{ backgroundColor, borderBottomColor, backdropFilter, WebkitBackdropFilter: backdropFilter }}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8"
      >
        <a href="#top" className="home-display whitespace-nowrap text-[0.875rem] text-[var(--gold)] sm:text-[1.0625rem]">
          The Money Tree of Life
        </a>
        <div className="flex items-center gap-1">
          <a href="#chapters" className={`${navLink} hidden md:inline-flex`}>
            Chapters
          </a>
          <a href="#families" className={`${navLink} hidden md:inline-flex`}>
            For families
          </a>
          <Link href="/read/glossary" className={`${navLink} hidden lg:inline-flex`}>
            Glossary
          </Link>
          <span className="ml-2">
            <OpenBookButton compact />
          </span>
        </div>
      </nav>
    </motion.header>
  );
}
