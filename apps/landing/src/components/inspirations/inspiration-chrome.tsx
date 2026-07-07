import Link from 'next/link';
import type { ReactNode } from 'react';
import type { InspirationDirection } from '@/data/inspirations';

/** Minimal chrome for inspiration previews — back link + variant label, no store nav. */
export const InspirationChrome = ({
  direction,
  children,
}: {
  direction: InspirationDirection;
  children: ReactNode;
}) => (
  <div
    className="min-h-screen"
    style={{ background: direction.palette.bg, color: direction.palette.fg }}
  >
    <div
      className="sticky top-0 z-50 flex items-center justify-between border-b px-4 py-2 text-xs backdrop-blur sm:px-6"
      style={{
        borderColor: `${direction.palette.muted}33`,
        background: `${direction.palette.bg}cc`,
      }}
    >
      <Link
        href="/inspirations"
        className="opacity-70 transition-opacity hover:opacity-100"
        style={{ color: direction.palette.fg }}
      >
        ← All inspirations
      </Link>
      <span className="font-medium opacity-60">{direction.name}</span>
      <Link
        href="/"
        className="opacity-70 transition-opacity hover:opacity-100"
        style={{ color: direction.palette.fg }}
      >
        Production home
      </Link>
    </div>
    {children}
  </div>
);

/** Shared CTA button styled to each direction's accent. */
export const InspirationCta = ({
  direction,
  href = '/checkout',
}: {
  direction: InspirationDirection;
  href?: string;
}) => (
  <Link
    href={href}
    className="inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
    style={{
      background: direction.palette.accent,
      color:
        direction.slug === 'bold-statement' || direction.slug === 'terminal-to-live'
          ? '#000'
          : '#fff',
    }}
  >
    {direction.cta}
  </Link>
);
