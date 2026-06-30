'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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

/** Renders hover flyouts on document.body so dock overflow cannot clip them. */
export function ReportFlyoutPortal({
  open,
  style,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ReportFlyoutPortalProps) {
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
      style={style}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}
