import { Button } from '@vybekiit/ui/button';

import { ChromeLogo, EdgeLogo } from '@/components/ui/BrowserLogos';
import { BROWSER_CTAS, type BrowserCta } from '@/data/landingContent';
import { cn } from '@/lib/utils';

const BROWSER_LOGOS = { chrome: ChromeLogo, edge: EdgeLogo } as const;

export interface AddToBrowserButtonProps {
  /** Which install CTA to render (logo + label + variant come from the record). */
  readonly cta: BrowserCta;
  /** Extra classes on the button. */
  readonly className?: string;
}

/**
 * A single install CTA — a kit `Button` rendered as an anchor with a leading
 * browser brand logo. "Add to Chrome" is the solid accent; "Add to Edge" is outline.
 *
 * @param props - The `BrowserCta` record and optional button classes.
 * @returns An anchor-styled install button with the browser logo.
 * @example
 * <AddToBrowserButton cta={BROWSER_CTAS[0]} />
 */
export const AddToBrowserButton = ({ cta, className }: AddToBrowserButtonProps) => {
  const Logo = BROWSER_LOGOS[cta.browser];
  return (
    <Button asChild={true} className={cn('gap-2', className)} size="lg" variant={cta.variant}>
      <a href={cta.href}>
        <Logo className="h-5 w-5" />
        {cta.label}
      </a>
    </Button>
  );
};

export interface AddToBrowserButtonsProps {
  /** Extra classes on the button row wrapper. */
  readonly className?: string;
}

/**
 * The Chrome + Edge install button pair, mapped from the `BROWSER_CTAS` data
 * array so the two near-identical CTAs are never pasted by hand.
 *
 * @param props - Optional wrapper classes for the button row.
 * @returns A flex row of the two install buttons.
 * @example
 * <AddToBrowserButtons className="justify-center" />
 */
export const AddToBrowserButtons = ({ className }: AddToBrowserButtonsProps) => (
  <div className={cn('flex flex-wrap items-center gap-3', className)}>
    {BROWSER_CTAS.map((cta) => (
      <AddToBrowserButton cta={cta} key={cta.key} />
    ))}
  </div>
);
