import { toast as sonnerToast } from 'sonner';

/** Visual intent of a toast — maps to Sonner's success/error variants. */
type ToastVariant = 'default' | 'destructive';

/** A single active toast (kept for type compatibility with the legacy store). */
interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}

const EMPTY_TOASTS: readonly Toast[] = [];

/**
 * Fire-and-forget toast helper backed by Sonner.
 *
 * Call `toast('Saved!')` from anywhere; the root `<Toaster />` in `app/layout.tsx`
 * renders it. Destructive toasts use Sonner's error styling.
 *
 * @returns A stable toast dispatcher plus an empty compatibility list.
 * @example
 * const { toast } = useToast();
 */
const useToast = (): {
  readonly toast: (message: string, variant?: ToastVariant) => void;
  readonly toasts: readonly Toast[];
} => ({
  toast: (message, variant = 'default') => {
    if (variant === 'destructive') {
      sonnerToast.error(message);
    } else {
      sonnerToast(message);
    }
  },
  toasts: EMPTY_TOASTS,
});

export { useToast };
export type { Toast, ToastVariant };
