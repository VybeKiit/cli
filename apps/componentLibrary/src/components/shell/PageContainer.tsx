import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageContainerSize = 'default' | 'wide';

const SIZE_CLASSNAME: Record<PageContainerSize, string> = {
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
};

interface PageContainerProps {
  readonly children: ReactNode;
  readonly size?: PageContainerSize;
  readonly className?: string;
}

/**
 * The one centered content column every library section shares: standard max-width + page padding.
 * Sections render inside the shell's `SidebarInset` (already a `<main>`), so this is a plain `<div>`
 * — use `size="wide"` for card grids, the default reading width for detail and document pages.
 *
 * @param props - Container size and content.
 * @returns The centered page container.
 * @example
 * const element = <PageContainer size="wide">{content}</PageContainer>;
 */
export const PageContainer = ({ children, size = 'default', className }: PageContainerProps) => (
  <div className={cn('mx-auto w-full min-w-0 p-6 pb-24 md:p-8', SIZE_CLASSNAME[size], className)}>
    {children}
  </div>
);
