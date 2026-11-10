import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search } from 'lucide-react';
import { PageShell, PageIntro } from '@/components/site/PageShell';
import { CHAPTERS, GLOSSARY, isEpilogue } from '@/data/content';

/** The chapter whose "New money words" first lists each term. */
const FIRST_CHAPTER = new Map<string, (typeof CHAPTERS)[number]>();
for (const c of CHAPTERS) {
  for (const w of c.kit?.words ?? []) {
    const key = w.toLowerCase();
    if (!FIRST_CHAPTER.has(key)) FIRST_CHAPTER.set(key, c);
  }
}

const SORTED = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));

/** Terms grouped under their first letter (or one group while filtering). */
function groups(terms: typeof SORTED, byLetter: boolean) {
  if (!byLetter) return [{ letter: '', terms }];
  const out: { letter: string; terms: typeof SORTED }[] = [];
  for (const t of terms) {
    const letter = t.term[0].toUpperCase();
    if (out.at(-1)?.letter !== letter) out.push({ letter, terms: [] });
    out.at(-1)!.terms.push(t);
  }
  return out;
}

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const terms = useMemo(
    () => (q ? SORTED.filter((t) => t.term.toLowerCase().includes(q) || t.shortDefinition.toLowerCase().includes(q)) : SORTED),
    [q],
  );
  const letters = useMemo(() => Array.from(new Set(SORTED.map((t) => t.term[0].toUpperCase()))), []);

  // Arriving from a word in the story (#g12): bring it into view.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <PageShell title="Money words">
      <PageIntro
        title="Money words"
        lead={`Every money word from the book, in plain language. ${GLOSSARY.length} words, with the chapter where each one first appears.`}
      />
      <div className="mx-auto max-w-container px-5 pb-24 sm:px-8">
        <div className="sticky top-[68px] z-10 -mx-5 border-b border-hairline bg-night/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <label htmlFor="glossary-filter" className="sr-only">
            Find a word
          </label>
          <div className="relative max-w-[28rem]">
            <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-3" />
            <input
              id="glossary-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a word"
              autoComplete="off"
              className="h-12 w-full rounded-pill border border-[rgba(230,185,85,0.28)] bg-night-2 pl-11 pr-4 text-cream placeholder:text-cream-3 focus:border-gold focus:outline-none"
              data-testid="input-search"
            />
          </div>
          {!q && (
            <nav aria-label="Letters" className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
              {letters.map((l) => (
                <a
                  key={l}
                  href={`#letter-${l}`}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-pill font-display font-bold text-gold/70 hover:text-gold"
                >
                  {l}
                </a>
              ))}
            </nav>
          )}
        </div>

        <p className="mt-6 text-[0.875rem] text-cream-3" aria-live="polite">
          {q ? `${terms.length} ${terms.length === 1 ? 'word' : 'words'} found` : `${terms.length} words`}
        </p>

        {terms.length === 0 ? (
          <div className="mt-8 max-w-measure">
            <p className="text-cream-2">No money word matches “{query}”.</p>
            <Link
              href={`/read/search?q=${encodeURIComponent(query)}`}
              className="mt-3 inline-block font-bold text-gold underline underline-offset-4"
            >
              Search the whole book instead
            </Link>
          </div>
        ) : (
          <div className="mt-4" data-testid="glossary-terms">
            {groups(terms, !q).map((g) => (
              <section key={g.letter || 'all'} aria-labelledby={g.letter ? `letter-${g.letter}` : undefined}>
                {g.letter && (
                  <h2
                    id={`letter-${g.letter}`}
                    className="mt-10 scroll-mt-[190px] font-display text-[1.75rem] font-bold text-gold/70"
                  >
                    {g.letter}
                  </h2>
                )}
                <dl>
                  {g.terms.map((t) => {
                    const first = FIRST_CHAPTER.get(t.term.toLowerCase());
                    return (
                      <div
                        key={t.id}
                        id={t.id}
                        className="grid scroll-mt-[200px] gap-1 border-t border-hairline py-5 target:bg-gold/[0.06] sm:grid-cols-[14rem_1fr] sm:gap-8"
                        data-testid={`term-${t.term.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <dt className="font-display text-[1.2rem] font-semibold text-cream">{t.term}</dt>
                        <dd>
                          <p className="max-w-measure text-[1.0625rem] leading-[1.6] text-cream-2">{t.shortDefinition}</p>
                          {first && (
                            <Link
                              href={`/read/${first.slug}`}
                              className="mt-2 inline-block text-[0.875rem] text-cream-3 underline decoration-gold/30 underline-offset-4 hover:text-gold"
                            >
                              First in {isEpilogue(first) ? 'the epilogue' : first.label}: {first.title}
                            </Link>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
