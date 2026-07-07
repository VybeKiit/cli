'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface ReportFlyoutPortalProps {
  readonly open: boolean;
  readonly style: CSSProperties;
  readonly className?: string;
  readonly children: ReactNode;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly 'data-testid'?: string;
  readonly role?: string;
  readonly 'aria-label'?: string;
}

/**
 * Renders hover flyouts on document.body so dock overflow cannot clip them. Forwards a ref to the
 * flyout root so `useReportFlyoutPosition` can measure its size and clamp it inside the viewport.
 *
 * @param props - Portal visibility, positioning style, forwarded ref, and semantic attributes.
 * @returns A document-body portal while open, otherwise `null`.
 * @example
 * <ReportFlyoutPortal open={open} style={style} role="menu">Menu</ReportFlyoutPortal>
 */
export const ReportFlyoutPortal = ({
  open,
  style,
  className = '',
  children,
  onMouseEnter,
  onMouseLeave,
  ref,
  ...props
}: ReportFlyoutPortalProps & { readonly ref?: RefObject<HTMLDivElement | null> }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!(open && mounted)) {
    return null;
  }

  return createPortal(
    <div
      className={cn('report-mode-flyout report-mode-flyout--open', className)}
      data-report-mode-ui={true}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={ref}
      style={style}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
};
