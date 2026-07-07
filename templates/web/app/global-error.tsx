'use client';

import messages from '../messages/en.json' with { type: 'json' };
import { Effect } from 'effect';
import { useEffect } from 'react';

interface GlobalErrorProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

/**
 * Render the global error boundary outside the locale layout.
 *
 * @param props - Error and reset callback supplied by Next.js.
 * @returns Default-locale error page with a retry button.
 * @example
 * <GlobalError error={error} reset={reset} />
 */
const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    // Client boundary — avoid `@/lib/observability` (pulls `@sentry/node`). The
    // `track-errors` skill wires browser Sentry separately when requested.
    Effect.runFork(Effect.logError(`${error.name}: ${error.message}`));
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <h1 className="font-semibold text-lg">{messages['common.error.somethingWentWrong']}</h1>
          <p className="text-muted-foreground text-sm">{messages['common.error.tryAgainPrompt']}</p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
            onClick={reset}
          >
            {messages['common.error.tryAgain']}
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
