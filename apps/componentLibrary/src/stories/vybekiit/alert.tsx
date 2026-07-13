'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const ALERTS = [
  {
    variant: 'default',
    Icon: Info,
    title: 'Heads up',
    body: 'This is a standard informational message.',
  },
  {
    variant: 'success',
    Icon: CircleCheck,
    title: 'Saved',
    body: 'Your changes were saved successfully.',
  },
  {
    variant: 'warning',
    Icon: TriangleAlert,
    title: 'Check your plan',
    body: 'You are getting close to your monthly limit.',
  },
  {
    variant: 'destructive',
    Icon: CircleAlert,
    title: 'Something went wrong',
    body: 'We could not process your request. Try again.',
  },
] as const;

/** Every Alert tone, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="grid w-full max-w-xl gap-4">
      {ALERTS.map(({ variant, Icon, title, body }) => (
        <Alert key={variant} variant={variant}>
          <Icon className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{body}</AlertDescription>
        </Alert>
      ))}
    </div>
  ),
};

export default story;
