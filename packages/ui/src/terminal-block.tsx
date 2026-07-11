'use client';

import { cn } from './utils';

interface TerminalBlockProps {
  readonly lines: string[];
  readonly title?: string;
  readonly variant?: 'dark' | 'transparent';
  readonly className?: string;
}

/**
 * Render terminal-style output with colored title bar dots.
 *
 * @param props - Terminal lines, title, visual variant, and optional classes.
 * @returns A styled terminal output block.
 * @example
 * <TerminalBlock lines={['pnpm verify']} />;
 */
export const TerminalBlock = ({
  lines,
  title = 'Terminal',
  variant = 'dark',
  className,
}: TerminalBlockProps) => {
  const rows = lines.map((line, rowIndex) => ({
    id: `terminal-line-${rowIndex + 1}:${line}`,
    line,
  }));

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        variant === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800/50 bg-zinc-900/50',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-zinc-800/50 border-b px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="ml-2 font-mono text-xs text-zinc-500">{title}</span>
      </div>
      <div className="p-3 font-mono text-xs leading-relaxed">
        {rows.map(({ id, line }) => (
          <div key={id} className="flex">
            <span className="mr-2 select-none text-zinc-600">$</span>
            <span className="text-zinc-300">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
