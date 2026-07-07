import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MiniPhoneShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * iPhone-style frame for mobile dashboard previews.
 *
 * @param props - Component props.
 * @returns The rendered MiniPhoneShell element.
 * @example
 * ```tsx
 * <MiniPhoneShell />
 * ```
 */

export const MiniPhoneShell = ({ children, className }: MiniPhoneShellProps) => (
  <div
    className={cn(
      'mx-auto flex w-full max-w-[220px] flex-col rounded-[32px] border-[3px] border-[#1a1f28] bg-[#050810] p-2 shadow-2xl',
      className,
    )}
  >
    <div className="mx-auto mb-1.5 h-1.5 w-14 rounded-full bg-white/15" />
    <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] bg-[#080d16]">{children}</div>
  </div>
);
