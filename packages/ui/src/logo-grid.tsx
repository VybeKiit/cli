'use client';

import { useCallback, useState } from 'react';
import { cn } from './utils';

type LogoItemData = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly svg: string;
};

interface LogoGridProps {
  readonly logos: readonly LogoItemData[];
  readonly selectable?: boolean;
  readonly selected?: readonly string[];
  readonly onSelect?: (id: string) => void;
  readonly columns?: number;
  readonly className?: string;
}

interface LogoGridItemProps {
  readonly logo: LogoItemData;
  readonly selectable: boolean;
  readonly isSelected: boolean;
  readonly isHovered: boolean;
  readonly onSelect: ((id: string) => void) | undefined;
  readonly onHover: (id: string | null) => void;
}

/**
 * Render one selectable logo tile.
 *
 * @param props - Logo data, selection state, and stable event hooks.
 * @returns A button tile with the inline brand SVG.
 * @example
 * <LogoGridItem logo={logo} selectable={false} isSelected={false} isHovered={false} onHover={() => {}} />;
 */
const LogoGridItem = ({
  logo,
  selectable,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: LogoGridItemProps) => {
  const handleClick = useCallback(() => {
    if (selectable) {
      onSelect?.(logo.id);
    }
  }, [logo.id, onSelect, selectable]);

  const handleMouseEnter = useCallback(() => {
    onHover(logo.id);
  }, [logo.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <button
      key={logo.id}
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'flex items-center gap-2 rounded-xl border p-2.5 transition-all duration-300',
        isSelected
          ? 'scale-[1.02] border-transparent opacity-100'
          : 'border-zinc-800 opacity-50 grayscale',
        isHovered && !isSelected && 'opacity-75 grayscale-[50%]',
        selectable && 'cursor-pointer hover:scale-[1.02] active:scale-95',
      )}
      style={{ boxShadow: isSelected ? `0 0 16px ${logo.color}44` : undefined }}
    >
      <div
        className="h-5 w-5 shrink-0 transition-all duration-300"
        style={{ color: isSelected || isHovered ? logo.color : '#71717a' }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Logo SVGs are curated registry marks.
        dangerouslySetInnerHTML={{ __html: logo.svg }}
      />
      <span
        className={cn(
          'font-medium text-xs transition-colors',
          isSelected ? 'text-zinc-200' : 'text-zinc-500',
        )}
      >
        {logo.name}
      </span>
    </button>
  );
};

/**
 * Render an animated grid of tech/brand logos with optional selection.
 *
 * @param props - Logo list, selection state, column count, and optional classes.
 * @returns A responsive logo grid.
 * @example
 * <LogoGrid logos={logos} selectable selected={['cloudflare']} />;
 */
export const LogoGrid = ({
  logos,
  selectable = false,
  selected = [],
  onSelect,
  columns = 3,
  className,
}: LogoGridProps) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const handleHover = useCallback((id: string | null) => {
    setHovered(id);
  }, []);

  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {logos.map((logo) => (
        <LogoGridItem
          key={logo.id}
          logo={logo}
          selectable={selectable}
          isSelected={selected.includes(logo.id)}
          isHovered={hovered === logo.id}
          onSelect={onSelect}
          onHover={handleHover}
        />
      ))}
    </div>
  );
};
