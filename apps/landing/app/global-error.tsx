'use client';

import { captureException } from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

interface GlobalErrorProps {
  readonly error: Error & { readonly digest?: string };
}

/**
 * Root App Router error boundary — captures React render errors to Sentry.
 * Must live outside the root layout so it can replace a broken `<html>`.
 *
 * @param props - Error supplied by Next.js.
 * @returns Generic Next.js error page.
 * @example
 * // Next.js renders this automatically on uncaught root errors.
 */
const GlobalError = ({ error }: GlobalErrorProps) => {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* App Router does not expose HTTP status codes for render errors. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
};

export default GlobalError;
