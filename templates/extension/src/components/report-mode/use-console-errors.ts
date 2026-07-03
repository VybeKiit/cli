'use client';

import { ConsoleErrorBuffer } from '@vybekiit/report-mode';
import { useEffect, useRef } from 'react';

/** Capture recent console errors while Report Mode is mounted (dev only). */
export function useConsoleErrorBuffer(): ConsoleErrorBuffer {
  const bufferRef = useRef<ConsoleErrorBuffer | null>(null);
  if (!bufferRef.current) {
    bufferRef.current = new ConsoleErrorBuffer(3);
  }
  const buffer = bufferRef.current;

  useEffect(() => {
    const previousOnError = window.onerror;
    const previousOnUnhandled = window.onunhandledrejection;

    window.onerror = (message, _source, _line, _col, error) => {
      const text =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : typeof message === 'string'
            ? message
            : 'Unknown error';
      buffer.push(text);
      if (typeof previousOnError === 'function') {
        return previousOnError(message, _source, _line, _col, error);
      }
      return false;
    };

    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      const text =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : typeof reason === 'string'
            ? reason
            : 'Unhandled promise rejection';
      buffer.push(text);
      if (typeof previousOnUnhandled === 'function') {
        return previousOnUnhandled.call(window, event);
      }
    };

    return () => {
      window.onerror = previousOnError;
      window.onunhandledrejection = previousOnUnhandled;
    };
  }, [buffer]);

  return buffer;
}
