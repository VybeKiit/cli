'use client';

import { ConsoleErrorBuffer } from '@vybekiit/report-mode';
import { useEffect, useRef } from 'react';

function formatConsoleErrorMessage(message: unknown, error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof message === 'string') return message;
  return 'Unknown error';
}

function formatRejectionMessage(reason: unknown): string {
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`;
  if (typeof reason === 'string') return reason;
  return 'Unhandled promise rejection';
}

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
      const text = formatConsoleErrorMessage(message, error);
      buffer.push(text);
      if (typeof previousOnError === 'function') {
        return previousOnError(message, _source, _line, _col, error);
      }
      return false;
    };

    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      const text = formatRejectionMessage(reason);
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
