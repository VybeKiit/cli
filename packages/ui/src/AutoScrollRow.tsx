import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type Key,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './utils';

interface AutoScrollRowProps {
  readonly children: ReactNode;
  readonly ariaLabel: string;
  readonly durationDesktop?: string;
  readonly durationMobile?: string;
  readonly pauseOnHover?: boolean;
  readonly className?: string;
  readonly trackClassName?: string;
  readonly rowClassName?: string;
}

/**
 * Build a stable clone key for the duplicated scrolling row.
 *
 * @param key - Original React key, when present.
 * @param fallback - Fallback key segment for unkeyed children.
 * @returns A clone key with the `-clone` suffix.
 * @example
 * resolveCloneKey('logo', 'row') === 'logo-clone';
 */
const resolveCloneKey = (key: Key | null, fallback: string | number): string => {
  if (key === null) {
    return `${fallback}-clone`;
  }
  return `${String(key)}-clone`;
};

/**
 * Clone row content for the second loop copy.
 *
 * @param children - Original row content.
 * @returns A clone tree marked as hidden from assistive tech when possible.
 * @example
 * const copy = cloneForLoop(children);
 */
const cloneForLoop = (children: ReactNode): ReactNode => {
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<{ 'aria-hidden'?: boolean }>, {
      'aria-hidden': true,
      key: resolveCloneKey(children.key, 'row'),
    });
  }

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) {
      return child;
    }
    return cloneElement(child as ReactElement, {
      key: resolveCloneKey(child.key, index),
    });
  });
};

/**
 * Render a horizontal row that scrolls and loops seamlessly.
 *
 * @param props - Row content, accessible label, and optional timing/class overrides.
 * @returns A self-looping horizontal row with a hidden clone track.
 * @example
 * <AutoScrollRow ariaLabel="Partners">...</AutoScrollRow>;
 */
export const AutoScrollRow = ({
  children,
  ariaLabel,
  durationDesktop = '80s',
  durationMobile = '55s',
  pauseOnHover = true,
  className,
  trackClassName,
  rowClassName,
}: AutoScrollRowProps) => {
  const style = {
    ['--auto-scroll-duration-desktop' as string]: durationDesktop,
    ['--auto-scroll-duration-mobile' as string]: durationMobile,
  } as CSSProperties;

  return (
    <div
      aria-label={ariaLabel}
      className={cn('auto-scroll-row', pauseOnHover && 'auto-scroll-row--pause-hover', className)}
      role="region"
      style={style}
    >
      <div className={cn('auto-scroll-row-track', trackClassName)}>
        <div className={cn('auto-scroll-row-copy', rowClassName)}>{children}</div>
        <div className={cn('auto-scroll-row-copy', rowClassName)}>{cloneForLoop(children)}</div>
      </div>
    </div>
  );
};
