import { toast as sonnerToast } from 'sonner';

/** Visual intent of a toast — maps to Sonner's success/error variants. */
export type ToastVariant = 'default' | 'destructive';

/** A single active toast (kept for type compatibility with the legacy store). */
export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}

/**
 * Fire-and-forget toast helper backed by Sonner.
 *
 * Call `toast('Saved!')` from anywhere; the root `<Toaster />` in `app/layout.tsx`
 * renders it. Destructive toasts use Sonner's error styling.
 */
export function useToast(): {
  toast: (message: string, variant?: ToastVariant) => void;
  toasts: Toast[];
} {
  return {
    toast: (message, variant = 'default') => {
      if (variant === 'destructive') sonnerToast.error(message);
      else sonnerToast(message);
    },
    toasts: [],
  };
}
