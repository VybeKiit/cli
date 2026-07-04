import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabletMockupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** Simple tablet frame for gallery preview chrome. */
export function TabletMockup({ children, className, ...props }: TabletMockupProps) {
  return (
    <div className={cn('mx-auto w-full max-w-2xl', className)} {...props}>
      <div className="rounded-[1.25rem] border-[8px] border-neutral-800 bg-neutral-900 p-1 shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[0.85rem] bg-black ring-1 ring-white/10">
          {children}
        </div>
      </div>
    </div>
  );
}

export default TabletMockup;
