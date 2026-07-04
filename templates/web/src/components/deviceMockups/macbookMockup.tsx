import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MacbookMockupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** Laptop shell for marketing previews and gallery device chrome. */
export function MacbookMockup({ children, className, ...props }: MacbookMockupProps) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)} {...props}>
      <div className="rounded-t-xl border border-neutral-700/80 bg-gradient-to-b from-neutral-700 to-neutral-900 p-2 pt-3 shadow-2xl">
        <div className="mb-2 flex justify-center">
          <div className="h-1 w-2 rounded-full bg-neutral-600" />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-black ring-1 ring-white/10">
          {children}
        </div>
      </div>
      <div className="relative mx-auto h-3 w-[42%] rounded-b-lg bg-gradient-to-b from-neutral-700 to-neutral-800 shadow-md">
        <div className="absolute inset-x-[20%] top-0 h-px bg-white/10" />
      </div>
    </div>
  );
}

export default MacbookMockup;
