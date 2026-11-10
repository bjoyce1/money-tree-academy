import { useEffect, useMemo, useState } from 'react';
import { Link, useSearch, useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { PageShell, PageIntro } from '@/components/site/PageShell';
import { isEpilogue } from '@/data/content';
import { searchBook } from '@/lib/search';

export default function SearchPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const initial = new URLSearchParams(search).get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const results = useMemo(() => searchBook(query), [query]);

  // Keep the query in the address, so a search can be shared or revisited.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const q = query.trim();
      navigate(q ? `/read/search?q=${encodeURIComponent(q)}` : '/read/search', { replace: true });
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, navigate]);

  const q = query.trim();

  return (
    <PageShell title={q ? `“${q}” in the book` : 'Search the book'}>
      <PageIntro title="Search the book" lead="Find a word, a name or an idea in every chapter, lesson and money word." />
      <div className="mx-auto max-w-container px-5 pb-24 sm:px-8">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="max-w-[36rem]">
          <label htmlFor="book-search" className="sr-only">
            Search the book
          </label>
          <div className="relative">
            <Search size={20} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-cream-3" />
            <input
              id="book-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “savings”, “Mrs. Carter” or “interest”"
              autoFocus
              autoComplete="off"
              className="h-14 w-full rounded-pill border border-[rgba(230,185,85,0.28)] bg-night-2 pl-14 pr-5 text-[1.0625rem] text-cream placeholder:text-cream-3 focus:border-gold focus:outline-none"
              data-testid="input-search"
            />
          </div>
        </form>

        <p className="mt-6 text-[0.875rem] text-cream-3" aria-live="polite">
          {q.length < 2 ? 'Type at least two letters.' : results.total === 0 ? `Nothing found for “${q}”.` : `${results.total} results`}
        </p>

        {results.terms.length > 0 && (
          <section aria-labelledby="words-title" className="mt-8">
            <h2 id="words-title" className="font-display text-[1.4rem] font-bold text-gold">
              Money words
            </h2>
            <ul className="mt-3">
              {results.terms.map((t) => (
                <li key={t.id} className="border-t border-hairline py-4">
                  <Link href={`/read/glossary#${t.id}`} className="group block">
                    <span className="font-display text-[1.15rem] font-semibold text-cream group-hover:text-gold">{t.term}</span>
                    <span className="mt-1 block max-w-measure text-cream-2">{t.shortDefinition}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.passages.length > 0 && (
          <section aria-labelledby="passages-title" className="mt-12">
            <h2 id="passages-title" className="font-display text-[1.4rem] font-bold text-gold">
              In the chapters
            </h2>
            <ul className="mt-3" data-testid="search-results">
              {results.passages.map((p, i) => (
                <li key={`${p.chapter.id}-${i}`} className="border-t border-hairline py-5">
                  <Link href={`/read/${p.chapter.slug}`} className="group block">
                    <span className="text-[0.875rem] text-cream-3">
                      {isEpilogue(p.chapter) ? 'Epilogue' : p.chapter.label}
                      {p.where === 'lesson' && ' · Lesson'}
                    </span>
                    <span className="mt-0.5 block font-display text-[1.1rem] font-semibold text-cream group-hover:text-gold">
                      {p.chapter.title}
                    </span>
                    <span className="mt-2 block max-w-measure leading-[1.6] text-cream-2">
                      {p.before}
                      <mark className="rounded-[3px] bg-gold/25 px-0.5 text-cream">{p.match}</mark>
                      {p.after}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageShell>
  );
}
