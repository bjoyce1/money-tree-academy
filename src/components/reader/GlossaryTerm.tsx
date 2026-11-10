import { useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Link } from 'wouter';
import { findTerm } from '@/data/content';
import { recordActivity } from '@/lib/rewards';

/** A money word in the story. Opens its definition from the book's glossary. */
export function GlossaryTerm({ term }: { term: string }) {
  const entry = findTerm(term);
  const counted = useRef(false);
  if (!entry) return <>{term}</>;

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open && !counted.current) {
          counted.current = true;
          recordActivity('glossary-used');
        }
      }}
    >
      <Popover.Trigger className="glossary-term" data-testid={`glossary-term-${entry.id}`}>
        {term}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          data-popover-panel
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[min(18rem,calc(100vw-2rem))] rounded-choice border border-reader-rule bg-reader-surface p-4 text-reader-ink shadow-paper-thumb data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <p className="font-display text-[1.05rem] font-bold text-reader-accent">{entry.term}</p>
          <p className="mt-1.5 text-[1rem] leading-[1.55] text-reader-soft">{entry.shortDefinition}</p>
          <Link
            href={`/read/glossary#${entry.id}`}
            className="mt-3 inline-block text-[0.875rem] text-reader-quiet underline underline-offset-4 hover:text-reader-accent"
          >
            All money words
          </Link>
          <Popover.Arrow className="fill-[var(--r-surface)]" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
