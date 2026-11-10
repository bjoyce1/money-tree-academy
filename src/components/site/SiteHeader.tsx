import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { OpenBookButton } from './GoldButton';

export const SITE_LINKS = [
  { href: '/read', label: 'Read' },
  { href: '/read/glossary', label: 'Glossary' },
  { href: '/characters', label: 'Guides' },
  { href: '/dashboard', label: 'Your progress' },
] as const;

/** A link is current on its own page; "Read" also covers chapter pages. */
export function isCurrent(href: string, location: string) {
  if (href === '/read') return location === '/read' || /^\/read\/(?!glossary|search)/.test(location);
  return location === href || location.startsWith(`${href}/`);
}

const navLink =
  'inline-flex min-h-[2.5rem] items-center rounded-pill px-3 text-[1rem] text-cream-2 hover:text-gold aria-[current=page]:text-gold';

export function SiteHeader() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(230,185,85,0.14)] bg-night/85 backdrop-blur-xl backdrop-saturate-150 supports-[not(backdrop-filter:blur(1px))]:bg-night">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-3 px-5 sm:px-8"
      >
        <Link href="/" className="whitespace-nowrap font-display text-[0.95rem] font-bold text-gold sm:text-[1.0625rem]">
          The Money Tree of Life
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={navLink} aria-current={isCurrent(l.href, location) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <Link
            href="/read/search"
            className={cn(navLink, 'w-10 justify-center px-0')}
            aria-label="Search the book"
            aria-current={location === '/read/search' ? 'page' : undefined}
          >
            <Search size={19} aria-hidden />
          </Link>
          <span className="ml-2">
            <OpenBookButton size="compact" />
          </span>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-cream hover:text-gold lg:hidden"
            aria-label="Open menu"
            data-testid="button-site-menu"
          >
            <Menu size={22} aria-hidden />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-night/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(86vw,360px)] flex-col border-l border-hairline bg-night-2 px-6 pb-8 pt-5 data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
              <div className="flex items-center justify-between">
                <Dialog.Title className="font-display text-[1.0625rem] font-bold text-gold">Menu</Dialog.Title>
                <Dialog.Close
                  className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-cream hover:text-gold"
                  aria-label="Close menu"
                >
                  <X size={22} aria-hidden />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">Pages of The Money Tree of Life</Dialog.Description>
              <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
                {[{ href: '/', label: 'Home' }, ...SITE_LINKS, { href: '/read/search', label: 'Search' }].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={(l.href === '/' ? location === '/' : isCurrent(l.href, location)) ? 'page' : undefined}
                      className="flex min-h-[3.25rem] items-center text-[1.125rem] text-cream hover:text-gold aria-[current=page]:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <OpenBookButton />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </nav>
    </header>
  );
}
