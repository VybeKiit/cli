'use client';

import { useEffect, useRef } from 'react';
import { ConsoleErrorBuffer } from '../types';

/**
 * Describe a captured window error.
 *
 * @param error - Error object supplied by the browser when available.
 * @param message - Fallback browser error message.
 * @returns Human-readable error description.
 * @example
 * const description = describeError(error, String(message));
 */
const describeError = (error: unknown, message: string): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return typeof message === 'string' ? message : 'Unknown error';
};

/**
 * Describe an unhandled promise rejection reason.
 *
 * @param reason - Rejection reason supplied by the browser.
 * @returns Human-readable rejection description.
 * @example
 * const description = describeRejection(event.reason);
 */
const describeRejection = (reason: unknown): string => {
  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`;
  }
  return typeof reason === 'string' ? reason : 'Unhandled promise rejection';
};

/**
 * Capture recent console errors while Report Mode is mounted.
 *
 * @returns A bounded console error buffer for the current Report Mode session.
 * @example
 * const consoleErrors = useConsoleErrorBuffer();
 */
export const useConsoleErrorBuffer = (): ConsoleErrorBuffer => {
  const bufferRef = useRef<ConsoleErrorBuffer | null>(null);
  if (bufferRef.current === null) {
    bufferRef.current = new ConsoleErrorBuffer(3);
  }
  const buffer = bufferRef.current;

  useEffect(() => {
    const previousOnError = globalThis.onerror;
    const previousOnUnhandled = globalThis.onunhandledrejection;

    // biome-ignore lint/complexity/useMaxParams: matches the DOM `window.onerror` handler signature.
    globalThis.onerror = (message, source, line, col, error) => {
      buffer.push(describeError(error, typeof message === 'string' ? message : ''));
      if (typeof previousOnError === 'function') {
        return previousOnError(message, source, line, col, error);
      }
      return false;
    };

    globalThis.onunhandledrejection = (event) => {
      buffer.push(describeRejection(event.reason));
      if (typeof previousOnUnhandled === 'function') {
        // biome-ignore lint/style/useGlobalThis: DOM handler `.call` receiver must be typed as `window`.
        return previousOnUnhandled.call(window, event);
      }
    };

    return () => {
      globalThis.onerror = previousOnError;
      globalThis.onunhandledrejection = previousOnUnhandled;
    };
  }, [buffer]);

  return buffer;
};
