'use client';

import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { Button } from '@vybekiit/ui/button';
import { CircleAlert, RefreshCw } from 'lucide-react';

interface DemoErrorStateProps {
  readonly title: string;
  readonly detail: string;
  readonly onRetry: () => void;
  readonly retryLabel?: string;
}

/**
 * Full-page error + retry used by interactive recipes.
 *
 * @param props - Title, detail, and retry handler.
 * @returns Destructive alert with a retry button.
 * @example
 * <DemoErrorState title="Orders could not load" detail="Retry when the API is up." onRetry={reload} />
 */
export const DemoErrorState = ({
  title,
  detail,
  onRetry,
  retryLabel = 'Retry',
}: DemoErrorStateProps) => (
  <section className="mx-auto max-w-md px-4 py-24">
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{detail}</AlertDescription>
    </Alert>
    <div className="mt-6 flex justify-center">
      <Button onClick={onRetry} type="button">
        <RefreshCw aria-hidden="true" className="h-4 w-4" /> {retryLabel}
      </Button>
    </div>
  </section>
);
