'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from './utils';

/** Default path for the synced VybeKiit logo mask asset. */
export const VYBEKIIT_LOGO_ASSET = '/vybekiit-logo.svg';

/** Props for the masked VybeKiit mark component. */
export interface VybeKitMarkProps extends HTMLAttributes<HTMLSpanElement> {
  readonly src?: string;
}

/**
 * Render the minimal VybeKiit block mark from the synced brand SVG.
 *
 * @param props - Span props plus an optional asset path override.
 * @returns Colorable VybeKiit mark sized by the caller's className.
 * @example
 * <VybeKitMark className="h-8 w-8 text-white" />
 */
export const VybeKitMark = ({
  className,
  src = VYBEKIIT_LOGO_ASSET,
  style,
  ...props
}: VybeKitMarkProps) => {
  const mask = `url("${src}") center / contain no-repeat`;
  const markStyle: CSSProperties = {
    WebkitMask: mask,
    mask,
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 bg-current', className)}
      style={markStyle}
      {...props}
    />
  );
};
