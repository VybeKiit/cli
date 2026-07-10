'use client';

import type { ReactNode } from 'react';

import { BrandMarkVibeHint } from '@/components/landing/BrandMarkVibeHint';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import type { TechTrustMark } from '@/data/visitorLanding';
import { cn } from '@/lib/utils';

interface LogoMarqueeRowProps {
  readonly marks: readonly TechTrustMark[];
  readonly ariaLabel: string;
  readonly reverse?: boolean;
  readonly durationDesktop?: string;
  readonly durationMobile?: string;
  /** Tighter gaps and marks for fixed-width surfaces (checkout dialog). */
  readonly compact?: boolean;
  /**
   * When false, logos are static (no hover vibe tooltips). Use in checkout so
   * portal bubbles do not cover dialog copy.
   */
  readonly showHints?: boolean;
  /** Absolute index offset into a combined popup pool (page strip only). */
  readonly indexOffset?: number;
  readonly activeIndex?: number | null;
}

interface MarkShellProps {
  readonly mark: TechTrustMark;
  readonly compact: boolean;
  readonly highlighted: boolean;
  readonly interactive: boolean;
}

/**
 * Single logo + label cell shared by hint and no-hint rows.
 *
 * @param props - Mark, density, and interaction mode.
 * @returns Mark content for the marquee list item.
 */
const MarkShell = ({ mark, compact, highlighted, interactive }: MarkShellProps) => {
  const className = cn(
    'trust-logo-item flex items-center rounded-md',
    compact ? 'gap-1.5 text-white/90' : 'gap-2.5',
    interactive && 'outline-none focus-visible:ring-2 focus-visible:ring-white/40',
    highlighted && 'trust-logo-item--active',
  );

  const body = (
    <>
      <LogoMarkIcon
        className={cn(
          'trust-logo-mark shrink-0',
          compact ? 'size-5 brightness-0 invert' : 'size-6',
        )}
        mono={false}
        slug={mark.slug}
      />
      <span
        className={cn(
          'trust-logo-label whitespace-nowrap font-medium',
          compact ? 'text-xs text-white' : 'text-sm',
        )}
      >
        {mark.label}
      </span>
    </>
  );

  if (!interactive) {
    return <span className={className}>{body}</span>;
  }

  return (
    <button className={className} type="button">
      {body}
    </button>
  );
};

/**
 * Optionally wrap a mark in the vibe-hint tooltip.
 *
 * @param props - Hint slug and children.
 * @returns Children, optionally tooltip-wrapped.
 */
const MaybeHint = ({
  showHints,
  slug,
  children,
}: {
  readonly showHints: boolean;
  readonly slug: string;
  readonly children: ReactNode;
}) => {
  if (!showHints) {
    return <>{children}</>;
  }
  return (
    <BrandMarkVibeHint instant={true} side="top" slug={slug}>
      {children}
    </BrandMarkVibeHint>
  );
};

/**
 * One infinite logo row. Hover can show a plain-English vibe tooltip on the page
 * strip; checkout uses `showHints={false}` so dialog copy stays readable.
 *
 * @param props - Marks, direction, size, and optional highlight index.
 * @returns The rendered marquee row.
 * @example
 * <LogoMarqueeRow ariaLabel="Stack" marks={TECH_TRUST_STRIP.marks} />
 */
export const LogoMarqueeRow = ({
  marks,
  ariaLabel,
  reverse = false,
  durationDesktop = '70s',
  durationMobile = '50s',
  compact = false,
  showHints = true,
  indexOffset = 0,
  activeIndex = null,
}: LogoMarqueeRowProps) => (
  <AutoScrollRow
    ariaLabel={ariaLabel}
    durationDesktop={durationDesktop}
    durationMobile={durationMobile}
    hoverBehavior="none"
    pauseOnHover={false}
    reverse={reverse}
    trackClassName="items-center"
  >
    <ul
      className={cn(
        'trust-logo-row flex items-center',
        compact ? 'gap-x-6 gap-y-2 px-3' : 'gap-x-10 gap-y-3 px-5',
      )}
    >
      {marks.map((mark, localIndex) => {
        const poolIndex = indexOffset + localIndex;
        const isHighlighted = activeIndex === poolIndex;
        return (
          <li key={mark.id} className="shrink-0">
            <MaybeHint showHints={showHints} slug={mark.slug}>
              <MarkShell
                compact={compact}
                highlighted={isHighlighted}
                interactive={showHints}
                mark={mark}
              />
            </MaybeHint>
          </li>
        );
      })}
    </ul>
  </AutoScrollRow>
);
