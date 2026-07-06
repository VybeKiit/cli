'use client';

import { useEffect, useState } from 'react';
import { cn } from './utils';

type TypeWriterProps = {
  text: string;
  speed?: number;
  cursor?: boolean;
  className?: string;
  onComplete?: () => void;
};

/** Typewriter text animation with blinking cursor. */
export const TypeWriter = ({
  text,
  speed = 40,
  cursor = true,
  className,
  onComplete,
}: TypeWriterProps) => {
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
