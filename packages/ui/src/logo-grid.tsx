'use client';

import { useState } from 'react';
import { cn } from './utils';

type LogoItemData = {
  id: string;
  name: string;
  color: string;
  svg: string;
};

type LogoGridProps = {
  logos: LogoItemData[];
  selectable?: boolean;
  selected?: string[];
  onSelect?: (id: string) => void;
  columns?: number;
  className?: string;
};

/** Animated grid of tech/brand logos with optional selection. */
export const LogoGrid = ({
  logos,
  selectable = false,
  selected = [],
  onSelect,
  columns = 3,
  className,
}: LogoGridProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {logos.map((logo) => {
        const isSelected = selected.includes(logo.id);
        const isHovered = hovered === logo.id;

        return (
          <button
            key={logo.id}
            type="button"
            onClick={() => selectable && onSelect?.(logo.id)}
            onMouseEnter={() => setHovered(logo.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 transition-all duration-300',
              isSelected
                ? 'border-transparent opacity-100 scale-[1.02]'
                : 'border-zinc-800 opacity-50 grayscale',
              isHovered && !isSelected && 'opacity-75 grayscale-[50%]',
              selectable && 'cursor-pointer hover:scale-[1.02] active:scale-95',
            )}
            style={{ boxShadow: isSelected ? `0 0 16px ${logo.color}44` : undefined }}
          >
            <div
              className="h-5 w-5 shrink-0 transition-all duration-300"
              style={{ color: isSelected || isHovered ? logo.color : '#71717a' }}
              dangerouslySetInnerHTML={{ __html: logo.svg }}
            />
            <span
              className={cn(
                'text-xs font-medium transition-colors',
                isSelected ? 'text-zinc-200' : 'text-zinc-500',
              )}
            >
              {logo.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
