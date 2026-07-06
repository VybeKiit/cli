'use client';

import { cn } from './utils';

type TerminalBlockProps = {
  lines: string[];
  title?: string;
  variant?: 'dark' | 'transparent';
  className?: string;
};

/** Terminal-style output block with colored title bar dots. */
export const TerminalBlock = ({
  lines,
  title = 'Terminal',
  variant = 'dark',
  className,
}: TerminalBlockProps) => (
  <div
    className={cn(
      'overflow-hidden rounded-xl border',
      variant === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800/50 bg-zinc-900/50',
      className,
    )}
  >
    <div className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2">
      <div className="flex gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="ml-2 text-[10px] font-mono text-zinc-500">{title}</span>
    </div>
    <div className="p-3 font-mono text-xs leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="mr-2 select-none text-zinc-600">$</span>
          <span className="text-zinc-300">{line}</span>
        </div>
      ))}
    </div>
  </div>
);
