import { Link } from 'wouter';

const footLink = 'text-cream-2 hover:text-gold';

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(230,185,85,0.14)] px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-container gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-[1.15rem] font-bold text-gold">The Money Tree of Life</p>
          <p className="mt-1 text-cream-2">By Cornelius A. Pratt</p>
          <p className="mt-6 max-w-[52ch] text-[0.875rem] leading-[1.6] text-cream-3">
            This book is for educational purposes. It does not provide personal financial, legal, tax, or
            investment advice. Children should use banking, payment, and investing tools only with a trusted adult.
          </p>
          <p className="mt-4 text-[0.875rem] text-cream-3">© 2026 Capism Publishing</p>
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
            Guides
          </Link>
          <Link href="/dashboard" className={footLink}>
            Your progress
          </Link>
        </nav>
      </div>
    </footer>
  );
}
