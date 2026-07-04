import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';

export interface Contributor {
  username: string;
  avatarUrl: string;
  profileUrl?: string;
}

export interface ContributorsWallProps {
  title?: string;
  subtitle?: ReactNode;
  contributors: Contributor[];
  totalCount?: number;
  columns?: number;
  tilt?: number;
  perspective?: number;
  speed?: number;
  height?: number | string;
  className?: string;
}

interface TooltipState {
  username: string;
  left: number;
  top: number;
}

const GAP = 12;

// Répète les avatars jusqu'à compléter la dernière rangée pour garder une grille rectangulaire.
function padToGrid(items: Contributor[], columns: number): Contributor[] {
  if (items.length === 0) return items;
  const remainder = items.length % columns;
  if (remainder === 0) return items;
  const fill = columns - remainder;
  return items.concat(
    Array.from({ length: fill }, (_, i) => items[i % items.length]),
  );
}

export default function ContributorsWall({
  title = 'Contributors',
  subtitle,
  contributors,
  totalCount,
  columns = 16,
  tilt = 18,
  perspective = 1100,
  speed = 24,
  height = 300,
  className,
}: ContributorsWallProps) {
  const wallRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [blockHeight, setBlockHeight] = useState(0);

  const tiles = useMemo(
    () => padToGrid(contributors, columns),
    [contributors, columns],
  );
  const count = totalCount ?? contributors.length;

  // Mesure la hauteur d'une copie de la grille pour que le défilement boucle sans couture.
  useLayoutEffect(() => {
    const block = blockRef.current;
    if (!block) return;
    const measure = () => setBlockHeight(block.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(block);
    return () => ro.disconnect();
  }, [tiles, columns]);

  // Défilement continu vers le haut ; en pause au survol d'une tuile pour rester lisible.
  const y = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (tooltip || blockHeight === 0) return;
    const wrap = blockHeight + GAP;
    let next = y.get() - (speed * delta) / 1000;
    if (next <= -wrap) next += wrap;
    y.set(next);
  });

  const handleEnter = (
    e: React.MouseEvent<HTMLElement>,
    username: string,
  ) => {
    const wall = wallRef.current;
    if (!wall) return;
    const tile = e.currentTarget.getBoundingClientRect();
    const box = wall.getBoundingClientRect();
    setTooltip({
      username,
      left: tile.left - box.left + tile.width / 2,
      top: tile.top - box.top,
    });
  };

  const planeStyle: CSSProperties = {
    transform: `rotateX(${tilt}deg)`,
    transformStyle: 'preserve-3d',
  };
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: GAP,
  };

  const renderGrid = (copy: number, ref?: React.Ref<HTMLDivElement>) => (
    <div ref={ref} className="grid w-full" style={gridStyle}>
      {tiles.map((c, i) => {
        const Tile = (c.profileUrl ? 'a' : 'div') as 'a';
        return (
          <Tile
            key={`${copy}-${c.username}-${i}`}
            {...(c.profileUrl
              ? { href: c.profileUrl, target: '_blank', rel: 'noreferrer' }
              : {})}
            aria-label={c.username}
            onMouseEnter={(e) => handleEnter(e, c.username)}
            className="group relative block aspect-square outline-none"
          >
            {/* La zone cliquable reste fixe et seule cette couche interne s'agrandit, pour que le curseur ne sorte jamais pendant le survol. */}
            <span className="absolute inset-0 overflow-hidden rounded-[3px] transition-transform duration-300 ease-out group-hover:z-20 group-hover:scale-[1.28] group-focus-visible:z-20 group-focus-visible:scale-[1.28]">
              <img
                src={c.avatarUrl}
                alt={c.username}
                loading="lazy"
                draggable={false}
                className="h-full w-full select-none object-cover grayscale brightness-95 transition duration-300 group-hover:grayscale-0 group-hover:brightness-100 group-focus-visible:grayscale-0 group-focus-visible:brightness-100 dark:brightness-[0.72] dark:group-hover:brightness-110 dark:group-focus-visible:brightness-110"
              />
              <span className="pointer-events-none absolute inset-0 rounded-[3px] ring-1 ring-inset ring-black/[0.08] transition group-hover:ring-black/30 dark:ring-white/[0.06] dark:group-hover:ring-white/40" />
            </span>
          </Tile>
        );
      })}
    </div>
  );

  return (
    <div
      className={`w-full px-6 py-10 sm:px-10 sm:py-14 bg-[var(--wall-bg)] text-zinc-900 [--wall-bg:#fafafa] dark:bg-[var(--wall-bg)] dark:text-white dark:[--wall-bg:#0a0a0a] ${className ?? ''}`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold tracking-tight whitespace-nowrap">
            {title}
          </h2>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
        <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">
          {subtitle ?? (
            <>
              Built by a community of{' '}
              <span className="font-semibold text-zinc-900/80 dark:text-white/70">
                {count}+
              </span>{' '}
              contributors.
            </>
          )}
        </p>
      </div>

      <div
        ref={wallRef}
        className="relative mx-auto mt-8 max-w-6xl overflow-hidden"
        style={{
          perspective: `${perspective}px`,
          perspectiveOrigin: '50% 50%',
          height,
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        <div className="h-full" style={planeStyle}>
          {/* Deux copies identiques empilées verticalement donnent l'illusion d'une boucle infinie. */}
          <motion.div className="flex w-full flex-col" style={{ y, gap: GAP }}>
            {renderGrid(0, blockRef)}
            {renderGrid(1)}
          </motion.div>
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(130% 95% at 50% 50%, transparent 30%, var(--wall-bg) 82%),
              linear-gradient(to bottom, var(--wall-bg) 0%, transparent 16%, transparent 84%, var(--wall-bg) 100%),
              linear-gradient(to right, var(--wall-bg) 0%, transparent 12%, transparent 88%, var(--wall-bg) 100%)
            `,
          }}
        />

        {tooltip && (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-md border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 shadow-lg shadow-black/10 dark:border-white/10 dark:bg-[#161616] dark:text-white dark:shadow-black/40"
            style={{ left: tooltip.left, top: tooltip.top }}
          >
            {tooltip.username}
            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-black/10 bg-white dark:border-white/10 dark:bg-[#161616]" />
          </div>
        )}
      </div>
    </div>
  );
}
