import { useEffect, useState } from 'react';

/** How long a toast stays on screen before it auto-dismisses, in ms. */
const TOAST_DURATION_MS = 4000;

/** Visual intent of a toast, mapped to the shared theme semantic colors. */
export type ToastVariant = 'default' | 'destructive';

/**
 * A single active toast.
 *
 * `id` is a stable, monotonic key (used for React list keys and dismissal);
 * never derive keys from `message`, which can repeat.
 */
export type Toast = Readonly<{
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}>;

/**
 * Minimal module-level toast store — no external dependency.
 *
 * Lives at module scope so any component can `toast(...)` and the single
 * `<Toaster />` (mounted once in the root layout) re-renders. A tiny
 * subscribe/emit pair keeps every `useToast()` consumer in sync without a Context
 * provider, which is overkill for a fire-and-forget notification. Ported from the
 * web template; only the consuming `<Toaster />` differs (RN vs DOM).
 */
let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();

/**
 * Notify every subscriber with the current immutable snapshot.
 *
 * @returns Nothing; subscriber callbacks receive the current toast list.
 * @example
 * emit();
 */
const emit = (): void => {
  for (const listener of listeners) {
    listener(toasts);
  }
};

/**
 * Remove a toast by id.
 *
 * @param id - Stable toast identifier to remove.
 * @returns Nothing; updates subscribers after removal.
 * @example
 * dismiss(1);
 */
const dismiss = (id: number): void => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

/**
 * Add a toast and schedule its auto-dismiss.
 *
 * @param message - Text shown in the toast.
 * @param variant - Visual intent for the toast.
 * @returns Nothing; updates subscribers after insertion.
 * @example
 * push('Saved', 'default');
 */
const push = (message: string, variant: ToastVariant): void => {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => dismiss(id), TOAST_DURATION_MS);
};

/**
 * Subscribe to live toasts and get a `toast(...)` trigger.
 *
 * @returns The toast dispatcher and current live toast list.
 * @example
 * const { toast } = useToast();
 */
export const useToast = (): {
  readonly toast: (message: string, variant?: ToastVariant) => void;
  readonly toasts: readonly Toast[];
} => {
  const [snapshot, setSnapshot] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.add(setSnapshot);
    setSnapshot(toasts);
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  return {
    toast: (message, variant = 'default') => push(message, variant),
    toasts: snapshot,
  };
};
