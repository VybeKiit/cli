'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { NotificationToast } from '@vybekiit/ui/notification-toast';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const TOASTS = [
  {
    variant: 'success' as const,
    icon: <CheckCircle className="h-4 w-4" />,
    message: 'Your project was published successfully.',
  },
  {
    variant: 'info' as const,
    icon: <Info className="h-4 w-4" />,
    message: 'A new version of the CLI is available.',
  },
  {
    variant: 'warning' as const,
    icon: <AlertTriangle className="h-4 w-4" />,
    message: "You're approaching your monthly request limit.",
  },
  {
    variant: 'error' as const,
    icon: <XCircle className="h-4 w-4" />,
    message: 'Deployment failed. Check your build logs.',
  },
] as const;

/** A real, dismissable toast — clicking × hides it (operable, not a dead handler). */
const DismissableToast = ({
  message,
  variant,
  icon,
}: {
  readonly message: string;
  readonly variant?: 'success' | 'info' | 'warning' | 'error';
  readonly icon?: ReactNode;
}) => {
  const [open, setOpen] = useState(true);

  if (!open) {
    return <p className="text-muted-foreground text-xs">Toast dismissed.</p>;
  }

  return (
    <NotificationToast
      duration={0}
      icon={icon}
      message={message}
      onDismiss={() => setOpen(false)}
      variant={variant}
    />
  );
};

/** All four NotificationToast tones: success, info, warning, error. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          all tones — persistent (duration=0)
        </p>
        <div className="grid gap-3">
          {TOASTS.map(({ variant, icon, message }) => (
            <div key={variant} className="space-y-1">
              <p className="text-xs text-muted-foreground">{variant}</p>
              <NotificationToast variant={variant} icon={icon} message={message} duration={0} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          with dismiss handler (icon only, no variant → defaults to info)
        </p>
        <DismissableToast message="Click × to dismiss this toast." />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          error — with dismiss
        </p>
        <DismissableToast
          icon={<XCircle className="h-4 w-4" />}
          message="Failed to save. Please try again."
          variant="error"
        />
      </div>
    </div>
  ),
};

export default story;
