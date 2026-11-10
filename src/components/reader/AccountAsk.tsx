import type { Chapter } from '@/data/content';

/** The Lovable build always has the chat function, so this is never shown. */
export function AccountAsk(_: { chapter: Chapter }) {
  return <p className="text-reader-soft">Asking questions is not available right now.</p>;
}
