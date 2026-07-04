'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ReportFlyoutPortalProps = {
  readonly open: boolean;
  readonly style: CSSProperties;
  readonly className?: string;
  readonly children: ReactNode;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly 'data-testid'?: string;
  readonly role?: string;
  readonly 'aria-label'?: string;
};

/**
 * Renders hover flyouts on document.body so dock overflow cannot clip them. Forwards a ref to the
 * flyout root so `useReportFlyoutPosition` can measure its size and clamp it inside the viewport.
 */
export const ReportFlyoutPortal = forwardRef<HTMLDivElement, ReportFlyoutPortalProps>(
  function ReportFlyoutPortal(
    { open, style, className, children, onMouseEnter, onMouseLeave, ...props },
    ref,
  ) {
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
