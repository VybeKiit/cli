'use client';

import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { parseDurationSeconds, useMarqueeLoop } from '@/hooks/useMarqueeLoop';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

type HoverBehavior = 'pause' | 'accelerate-reverse' | 'none';

interface AutoScrollRowProps {
  readonly children: ReactNode;
  readonly ariaLabel: string;
  readonly durationDesktop?: string;
  readonly durationMobile?: string;
  readonly pauseOnHover?: boolean;
  readonly hoverBehavior?: HoverBehavior;
  /** When true, the track scrolls the opposite way (right-to-left becomes left-to-right). */
  readonly reverse?: boolean;
  readonly className?: string;
  readonly trackClassName?: string;
  readonly rowClassName?: string;
}

const cloneForLoop = (children: ReactNode) => {
  if (isValidElement(children)) {
    const keySource = children.key === null ? 'row' : children.key;
    return cloneElement(children as ReactElement<{ 'aria-hidden'?: boolean }>, {
      'aria-hidden': true,
      key: `${keySource}-clone`,
    });
  }

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) {
      return child;
    }
    const keySource = child.key === null ? index : child.key;
    return cloneElement(child as ReactElement, {
      key: `${keySource}-clone`,
    });
  });
};

const resolveHoverBehavior = (
  hoverBehavior: HoverBehavior | undefined,
  pauseOnHover: boolean,
): HoverBehavior => {
  if (hoverBehavior !== undefined) {
    return hoverBehavior;
  }
  return pauseOnHover ? 'pause' : 'none';
};

/**
 * Horizontal row that scrolls on its own and loops seamlessly (edge fade included).
 *
 * @param props - Component props.
 * @returns The rendered AutoScrollRow element.
 * @example
 * ```tsx
 * <AutoScrollRow />
 * ```
 */

export const AutoScrollRow = ({
  children,
  ariaLabel,
  durationDesktop = '80s',
  durationMobile = '55s',
  pauseOnHover = true,
  hoverBehavior,
  reverse = false,
  className,
  trackClassName,
  rowClassName,
}: AutoScrollRowProps) => {
  const reduced = useReducedMotion();
  const regionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const resolvedHover = resolveHoverBehavior(hoverBehavior, pauseOnHover);
  const useJsMarquee = resolvedHover === 'accelerate-reverse' && !reduced;
  const [durationSeconds, setDurationSeconds] = useState(() =>
    parseDurationSeconds(durationMobile),
  );

  useEffect(() => {
    if (!useJsMarquee) {
      return;
    }
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      setDurationSeconds(parseDurationSeconds(mq.matches ? durationDesktop : durationMobile));
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [durationDesktop, durationMobile, useJsMarquee]);

  useMarqueeLoop(trackRef, copyRef, regionRef, {
    durationSeconds,
    direction: reverse ? -1 : 1,
    enabled: useJsMarquee,
  });

  const style = {
    ['--auto-scroll-duration-desktop' as string]: durationDesktop,
    ['--auto-scroll-duration-mobile' as string]: durationMobile,
  } as CSSProperties;

  return (
    <div
      ref={regionRef}
      aria-label={ariaLabel}
      className={cn(
        'auto-scroll-row',
        resolvedHover === 'pause' && 'auto-scroll-row--pause-hover',
        useJsMarquee && 'auto-scroll-row--js-marquee',
        reverse && 'auto-scroll-row--reverse',
        className,
      )}
      role="region"
      style={style}
    >
      <div ref={trackRef} className={cn('auto-scroll-row-track', trackClassName)}>
        <div ref={copyRef} className={cn('auto-scroll-row-copy', rowClassName)}>
          {children}
        </div>
        <div className={cn('auto-scroll-row-copy', rowClassName)}>{cloneForLoop(children)}</div>
      </div>
    </div>
  );
};
