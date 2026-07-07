import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabletMockupProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

/**
 * Render tablet chrome around gallery previews.
 *
 * @param props - Optional preview content plus native div props.
 * @returns A responsive tablet mockup frame.
 * @example
 * <TabletMockup><img alt="" src="/preview.png" /></TabletMockup>
 */
export const TabletMockup = ({ children = null, className = '', ...props }: TabletMockupProps) => (
  <div className={cn('mx-auto w-full max-w-2xl', className)} {...props}>
    <div className="rounded-[1.25rem] border-[8px] border-neutral-800 bg-neutral-900 p-1 shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[0.85rem] bg-black ring-1 ring-white/10">
        {children}
      </div>
    </div>
  </div>
);
