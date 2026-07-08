'use client';

import { Button, type ButtonProps } from '@vybekiit/ui/button';
import { Spinner } from '@vybekiit/ui/spinner';
import type { MouseEvent, ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DemoActionButtonProps
  extends Omit<ButtonProps, 'asChild' | 'children' | 'disabled' | 'onClick'> {
  readonly children: string;
  readonly icon: ReactElement;
  readonly disabled?: boolean;
  readonly loadingMs?: number;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Render a demo action button with a required leading icon and simulated loading state.
 *
 * @param props - Button label, icon, optional delay, and forwarded button props.
 * @returns A button that shows loading feedback for previewing async actions.
 * @example
 * const element = <DemoActionButton icon={<SaveIcon />}>Save</DemoActionButton>;
 */
export const DemoActionButton = ({
  children,
  icon,
  loadingMs = 1000,
  disabled = false,
  onClick,
  ...props
}: DemoActionButtonProps) => {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      setLoading(true);
      timerRef.current = setTimeout(() => {
        setLoading(false);
        timerRef.current = null;
      }, loadingMs);
    },
    [loadingMs, onClick],
  );

  return (
    <Button disabled={disabled || loading} onClick={handleClick} {...props}>
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      <span>{loading ? 'Working...' : children}</span>
    </Button>
  );
};
