import { cn } from '@/lib/utils';
import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

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

function cloneForLoop(children: ReactNode) {
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<{ 'aria-hidden'?: boolean }>, {
      'aria-hidden': true,
      key: `${children.key ?? 'row'}-clone`,
    });
  }

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) {
      return child;
    }
    return cloneElement(child as ReactElement, {
      key: `${child.key ?? index}-clone`,
    });
  });
}

/** Horizontal row that scrolls on its own and loops seamlessly (edge fade included). */
export function AutoScrollRow({
  children,
  ariaLabel,
  durationDesktop = '80s',
  durationMobile = '55s',
  pauseOnHover = true,
  className,
  trackClassName,
  rowClassName,
}: AutoScrollRowProps) {
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
}
