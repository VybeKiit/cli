'use client';

import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * Renders the active toasts from the module-level store. Mount this once at the
 * app root (see `app/layout.tsx`); anywhere else can fire one via `useToast()`.
 *
 * Accessible by default: the container is a native `<output>` (implicit
 * `role="status"`, `aria-live="polite"`) so screen readers announce new toasts
 * without stealing focus. Styling reuses the shared semantic Tailwind tokens
 * (`bg-background` / `border` / `text-foreground`, with the `destructive`
 * palette for errors) so toasts match the rest of the kit.
 */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <output className="pointer-events-none fixed bottom-4 end-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto w-72 rounded-md border px-4 py-3 text-sm shadow-lg',
            toast.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive text-destructive-foreground'
              : 'border bg-background text-foreground',
          )}
        >
          {toast.message}
        </div>
      ))}
    </output>
  );
}
