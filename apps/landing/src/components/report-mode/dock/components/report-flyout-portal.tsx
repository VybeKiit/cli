'use client';

import { type CSSProperties, forwardRef, type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ReportFlyoutPortalProps {
  readonly 'aria-label'?: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly open: boolean;
  readonly role?: string;
  readonly style: CSSProperties;
}

/**
 * Renders hover flyouts on document.body so dock overflow cannot clip them. Forwards a ref to the flyout root so `useReportFlyoutPosition` can measure its size and clamp it inside the viewport. <ReportFlyoutPortal open={open} ref={ref} style={style}> Menu </ReportFlyoutPortal>
 *
 * @returns The rendered ReportFlyoutPortal element.
 * @example
 * ```tsx
 * <ReportFlyoutPortal />
 * ```
 */

export const ReportFlyoutPortal = forwardRef<HTMLDivElement, ReportFlyoutPortalProps>(
  ({ open, style, className = '', children = null, onMouseEnter, onMouseLeave, ...props }, ref) => {
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
  },
);

ReportFlyoutPortal.displayName = 'ReportFlyoutPortal';
