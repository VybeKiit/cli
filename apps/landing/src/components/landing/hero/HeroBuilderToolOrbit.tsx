'use client';

import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { BUILDER_TOOL_MARKS } from '@/data/landing';
import { cn } from '@/lib/utils';

const ORBIT_POSITIONS = [
  { top: '12%', left: '8%', delay: '0s' },
  { top: '18%', right: '10%', delay: '-2s' },
  { top: '42%', left: '4%', delay: '-4s' },
  { top: '38%', right: '6%', delay: '-1s' },
  { top: '68%', left: '12%', delay: '-3s' },
  { top: '72%', right: '14%', delay: '-5s' },
  { top: '28%', left: '22%', delay: '-2.5s' },
  { top: '55%', right: '20%', delay: '-1.5s' },
] as const;

/** Floating builder-tool marks behind the hero headline. */
export function HeroBuilderToolOrbit({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('hero-builder-orbit pointer-events-none absolute inset-0 -z-0', className)}
    >
      {BUILDER_TOOL_MARKS.map((mark, index) => {
        const position = ORBIT_POSITIONS[index % ORBIT_POSITIONS.length] ?? ORBIT_POSITIONS[0];
        return (
          <div
            className="hero-builder-orbit-item group"
            key={mark.slug}
            style={{
              top: position.top,
              left: 'left' in position ? position.left : undefined,
              right: 'right' in position ? position.right : undefined,
              ['--brand-color' as string]: mark.hoverColor,
              animationDelay: position.delay,
            }}
          >
            <span className="relative inline-flex h-8 w-8">
              <LogoMarkIcon
                className="hero-builder-orbit-icon absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
                slug={mark.slug}
              />
              <LogoMarkIcon
                className="hero-builder-orbit-icon absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                slug={mark.slug}
                variant="3d"
              />
            </span>
            <span className="hero-builder-orbit-label">{mark.label}</span>
          </div>
        );
      })}
    </div>
  );
}
