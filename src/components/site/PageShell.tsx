import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/** Header, main landmark and footer shared by every page outside the reader and home. */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · The Money Tree of Life`;
  }, [title]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-night text-cream">
        <a
          href="#main"
          className="sr-only z-50 rounded-pill bg-gold px-4 py-2 font-bold text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}

/** A page heading block: Cinzel headline and an optional lead paragraph. */
export function PageIntro({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-container px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
      <h1 className="text-balance font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] text-gold">
        {title}
      </h1>
      {lead && <p className="mt-5 max-w-measure text-[clamp(1.05rem,1.4vw,1.2rem)] leading-[1.65] text-cream-2">{lead}</p>}
      {children}
    </div>
  );
}
