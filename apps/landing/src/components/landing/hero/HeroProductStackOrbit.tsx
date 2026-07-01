'use client';

import { HERO_STACK_MARKS } from '@/data/brandMarks3d';
import { cn } from '@/lib/utils';

/** Static product-stack marks behind the hero headline — CSS float only, no WebGL. */
export function HeroProductStackOrbit({ className }: { readonly className?: string }) {
  if (HERO_STACK_MARKS.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'hero-product-stack-orbit pointer-events-none absolute inset-0 -z-0',
        className,
      )}
    >
      {HERO_STACK_MARKS.map((entry) => (
        <img
          alt=""
          className={cn(
            'hero-product-stack-item',
            entry.tier === '3d' && 'hero-product-stack-item--3d',
            entry.tier === '2d' && 'hero-product-stack-item--2d',
            'hero-product-stack-item--float',
          )}
          decoding="async"
          draggable={false}
          key={entry.slug}
          src={entry.src}
          style={{
            left: `${entry.x * 100}%`,
            top: `${entry.y * 100}%`,
            width: `${entry.scale * 3.25}rem`,
            animationDelay: `${entry.floatPhase * -0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
