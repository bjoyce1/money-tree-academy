import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Link } from 'wouter';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const press = { type: 'spring' as const, visualDuration: 0.18, bounce: 0 };

const base =
  'inline-flex items-center justify-center gap-[0.6rem] whitespace-nowrap rounded-pill font-bold select-none';
const sizes = {
  default: 'min-h-[3.25rem] px-[1.6rem] text-[1.0625rem]',
  compact: 'min-h-[2.5rem] px-4 text-[0.875rem]',
};
const variants = {
  gold: 'bg-gold text-night shadow-gold hover:bg-gold-hover',
  quiet: 'text-cream hover:text-gold',
  outline: 'border border-hairline text-cream hover:border-gold/60 hover:text-gold',
};

type Look = { size?: keyof typeof sizes; variant?: keyof typeof variants };

export function buttonClass({ size = 'default', variant = 'gold' }: Look = {}, className?: string) {
  return cn(base, sizes[size], variants[variant], className);
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & Look;

/** A pill button in the book's style. Gold is reserved for the main action. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { size, variant, className, ...props },
  ref,
) {
  return <button ref={ref} className={buttonClass({ size, variant }, className)} {...props} />;
});

/** Warm the lazily loaded flip book as soon as someone shows intent. */
let prefetched = false;
export const prefetchFlipbook = () => {
  if (prefetched) return;
  prefetched = true;
  void import('@/pages/FlipBookPage');
};

type LinkButtonProps = Look & { href: string; children: ReactNode; className?: string; 'data-testid'?: string };

export function LinkButton({ href, size, variant, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link href={href} className="inline-flex rounded-pill" {...rest}>
      <motion.span
        className={buttonClass({ size, variant }, className)}
        whileHover={variant === 'quiet' ? undefined : { y: -2 }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={press}
      >
        {children}
      </motion.span>
    </Link>
  );
}

/** The one primary action everywhere: open the flip book. */
export function OpenBookButton({ href = '/flipbook', size }: { href?: string; size?: Look['size'] }) {
  const compact = size === 'compact';
  return (
    <span onPointerEnter={prefetchFlipbook} onFocus={prefetchFlipbook} className="inline-flex">
      <LinkButton href={href} size={size} data-testid="button-open-flipbook">
        <BookOpen size={compact ? 17 : 19} strokeWidth={2} aria-hidden />
        Open the book
      </LinkButton>
    </span>
  );
}
