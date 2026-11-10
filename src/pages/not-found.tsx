import { PageShell } from '@/components/site/PageShell';
import { LinkButton, OpenBookButton } from '@/components/site/GoldButton';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <PageShell title="Page not found">
      <section className="mx-auto flex min-h-[60vh] max-w-container flex-col items-start justify-center px-5 py-20 sm:px-8">
        <h1 className="text-balance font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] text-gold">
          This page is not in the book.
        </h1>
        <p className="mt-5 max-w-measure text-[clamp(1.05rem,1.4vw,1.2rem)] leading-[1.65] text-cream-2">
          The link may be old, or the page may have moved. You can open the book, or start reading from the first
          chapter.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-2">
          <OpenBookButton />
          <LinkButton href="/read" variant="quiet">
            Go to the reader <ArrowRight size={18} aria-hidden />
          </LinkButton>
        </div>
      </section>
    </PageShell>
  );
}
