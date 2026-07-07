'use client';

import { useEffect, useState } from 'react';
import { cn } from './utils';

interface TypeWriterProps {
  readonly text: string;
  readonly speed?: number;
  readonly cursor?: boolean;
  readonly className?: string;
  readonly onComplete?: () => void;
}

/**
 * Typewriter text animation with an optional blinking cursor.
 *
 * @param props - Text, typing speed in milliseconds, cursor flag, classes, and completion handler.
 * @returns A span that reveals text over time.
 * @example
 * <TypeWriter text="Building your app" speed={30} />;
 */
export const TypeWriter = (props: TypeWriterProps) => {
  const { text, speed = 40, cursor = true, className = '', onComplete } = props;
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={cn('', className)}>
      {displayed}
      {cursor && !done && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current align-middle" />
      )}
    </span>
  );
};
