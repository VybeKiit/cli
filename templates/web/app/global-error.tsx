'use client';

import messages from '../messages/en.json' with { type: 'json' };
import { useEffect } from 'react';

/** Global error boundary — outside locale layout; uses default-locale catalog. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client boundary — avoid `@/lib/observability` (pulls `@sentry/node`). The
    // `track-errors` skill wires browser Sentry separately when requested.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-lg font-semibold">{messages['common.error.somethingWentWrong']}</h1>
          <p className="text-muted-foreground text-sm">{messages['common.error.tryAgainPrompt']}</p>
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
            onClick={() => reset()}
          >
            {messages['common.error.tryAgain']}
          </button>
        </main>
      </body>
    </html>
  );
}
