import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MiniBrowserChromeProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly url?: string;
  readonly dark?: boolean;
}

/**
 * Compact browser chrome for carousel and device mockups.
 *
 * @param props - Component props.
 * @returns The rendered MiniBrowserChrome element.
 * @example
 * ```tsx
 * <MiniBrowserChrome />
 * ```
 */

export const MiniBrowserChrome = ({
  children,
  className,
  url = 'app.vybekiit.com',
  dark = true,
}: MiniBrowserChromeProps) => (
  <div
    className={cn(
      'flex h-full flex-col overflow-hidden rounded-xl border shadow-sm',
      dark ? 'border-white/10 bg-[#070b12]' : 'border-black/8 bg-white',
      className,
    )}
  >
    <div
      className={cn(
        'flex items-center gap-2 border-b px-3 py-2',
        dark ? 'border-white/8 bg-[#0a1018]' : 'border-black/6 bg-[#f8fafc]',
      )}
    >
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
      </span>
      <div
        className={cn(
          'min-w-0 flex-1 truncate rounded-md px-2 py-1 text-[10px]',
          dark ? 'bg-white/[0.05] text-white/45' : 'bg-black/[0.04] text-[#526070]',
        )}
      >
        {url}
      </div>
    </div>
    <div className="min-h-0 flex-1">{children}</div>
  </div>
);
