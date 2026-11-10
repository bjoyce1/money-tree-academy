import { Link } from "wouter";
import { OpenBookButton } from "./Nav";

export function Closing() {
  return (
    <section aria-labelledby="close-title" className="home-close px-5 sm:px-8">
      <img
        src="/home/epilogue-band.webp"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className="mx-auto flex min-h-[min(88svh,760px)] max-w-[860px] flex-col items-center justify-center py-24 text-center">
        <h2
          id="close-title"
          className="home-display home-title-shadow text-[clamp(2.1rem,4.8vw,3.9rem)] leading-[1.1] text-[var(--gold)]"
        >
          Your future tree begins with what you plant today.
        </h2>
        <p className="home-title-shadow mt-5 text-[clamp(1.1rem,1.6vw,1.3rem)] text-[var(--cream)]">
          Every good choice is a seed.
        </p>
        <div className="mt-9">
          <OpenBookButton />
        </div>
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
