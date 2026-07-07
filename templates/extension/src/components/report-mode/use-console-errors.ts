'use client';

import { ConsoleErrorBuffer } from '@vybekiit/report-mode';
import { useEffect, useRef } from 'react';

/**
 * Capture recent console errors while Report Mode is mounted.
 *
 * @returns Bounded console error buffer for report submissions.
 * @example
 * const buffer = useConsoleErrorBuffer();
 */
const useConsoleErrorBuffer = (): ConsoleErrorBuffer => {
  const bufferRef = useRef<ConsoleErrorBuffer | null>(null);
  if (!bufferRef.current) {
    bufferRef.current = new ConsoleErrorBuffer(3);
  }
  const buffer = bufferRef.current;

  useEffect(() => {
    const handleError = (event: ErrorEvent): void => {
      buffer.push(formatErrorEvent(event));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      buffer.push(formatUnknownError(event.reason, 'Unhandled promise rejection'));
    };

    globalThis.addEventListener('error', handleError);
    globalThis.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      globalThis.removeEventListener('error', handleError);
      globalThis.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [buffer]);

  return buffer;
};

/**
 * Format a browser error event for report submissions.
 *
 * @param event - Browser error event to normalize.
 * @returns Human-readable error text.
 * @example
 * const text = formatErrorEvent(new ErrorEvent('error', { message: 'Boom' }));
 */
const formatErrorEvent = (event: ErrorEvent): string => {
  if (event.error instanceof Error) {
    return `${event.error.name}: ${event.error.message}`;
  }

  return formatUnknownError(event.message, 'Unknown error');
};

/**
 * Format an unknown thrown value for report submissions.
 *
 * @param value - Unknown thrown or rejected value.
 * @param fallback - Text to use when the value is not readable.
 * @returns Human-readable error text.
 * @example
 * const text = formatUnknownError('Failed', 'Unknown error');
 */
const formatUnknownError = (value: unknown, fallback: string): string => {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  return fallback;
};

export { useConsoleErrorBuffer };
