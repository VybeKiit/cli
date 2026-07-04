'use client';

import { type RefObject, useEffect, useRef } from 'react';

interface MarqueeLoopOptions {
  readonly durationSeconds: number;
  readonly hoverMultiplier?: number;
  readonly enabled?: boolean;
}

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/^([\d.]+)(s|ms)$/);
  if (!match) {
    return 55;
  }
  const value = Number(match[1]);
  return match[2] === 'ms' ? value / 1000 : value;
}

/** Smooth infinite marquee — velocity lerps on hover so direction/speed changes never jump. */
export function useMarqueeLoop(
  trackRef: RefObject<HTMLElement | null>,
  copyRef: RefObject<HTMLElement | null>,
  regionRef: RefObject<HTMLElement | null>,
  { durationSeconds, hoverMultiplier = 2.75, enabled = true }: MarqueeLoopOptions,
) {
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const targetVelocityRef = useRef(0);
  const hoveredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const track = trackRef.current;
    const copy = copyRef.current;
    const region = regionRef.current;
    if (!(track && copy && region)) {
      return;
    }

    let frameId = 0;
    let lastTime = performance.now();
    let loopWidth = copy.getBoundingClientRect().width;

    const measure = () => {
      loopWidth = copy.getBoundingClientRect().width || track.scrollWidth / 2;
      if (loopWidth <= 0) {
        return;
      }
      const baseSpeed = loopWidth / durationSeconds;
      targetVelocityRef.current = hoveredRef.current ? -baseSpeed * hoverMultiplier : baseSpeed;
      if (velocityRef.current === 0) {
        velocityRef.current = baseSpeed;
      }
    };

    measure();
    offsetRef.current = -loopWidth / 2;
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;

    const onEnter = () => {
      hoveredRef.current = true;
      measure();
    };

    const onLeave = () => {
      hoveredRef.current = false;
      measure();
    };

    const onResize = () => {
      measure();
    };

    region.addEventListener('pointerenter', onEnter);
    region.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (loopWidth > 0) {
        const baseSpeed = loopWidth / durationSeconds;
        targetVelocityRef.current = hoveredRef.current ? -baseSpeed * hoverMultiplier : baseSpeed;

        velocityRef.current +=
          (targetVelocityRef.current - velocityRef.current) * Math.min(1, dt * 8);
        offsetRef.current += velocityRef.current * dt;

        if (offsetRef.current >= 0) {
          offsetRef.current -= loopWidth;
        } else if (offsetRef.current <= -loopWidth) {
          offsetRef.current += loopWidth;
        }

        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      region.removeEventListener('pointerenter', onEnter);
      region.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      track.style.transform = '';
    };
  }, [copyRef, durationSeconds, enabled, hoverMultiplier, regionRef, trackRef]);
}

export { parseDurationSeconds };
