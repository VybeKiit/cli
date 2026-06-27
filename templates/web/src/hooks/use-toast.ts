import { useEffect, useState } from 'react';

/** How long a toast stays on screen before it auto-dismisses, in ms. */
const TOAST_DURATION_MS = 4000;

/** Visual intent of a toast — maps to the shared Tailwind semantic classes. */
export type ToastVariant = 'default' | 'destructive';

/**
 * A single active toast.
 *
 * `id` is a stable, monotonic key (used for React list keys and dismissal);
 * never derive keys from `message`, which can repeat.
 */
export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}

/**
 * Minimal module-level toast store — no external dependency.
 *
 * Lives at module scope so any component can `toast(...)` and the single
 * `<Toaster />` (mounted once at the app root) re-renders. A tiny
 * subscribe/emit pair keeps every `useToast()` consumer in sync without a
 * Context provider, which is overkill for a fire-and-forget notification.
 */
let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();

/** Notify every subscriber with the current immutable snapshot. */
function emit(): void {
  for (const listener of listeners) listener(toasts);
}

/** Remove a toast by id (used by auto-dismiss and the store itself). */
function dismiss(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

/** Add a toast and schedule its auto-dismiss. */
function push(message: string, variant: ToastVariant): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => dismiss(id), TOAST_DURATION_MS);
}

/**
 * Subscribe to live toasts and get a `toast(...)` trigger.
 *
 * The shared toast helper the project's standards reference: call
 * `toast('Check your email')` from anywhere (e.g. after a successful resend) and
 * the root `<Toaster />` renders it. Variants reuse the same `default` /
 * `destructive` semantics as the kit's other primitives.
 *
 * @returns `{ toast, toasts }` — `toast(message, variant?)` to show one, and the
 *   live `toasts` list (consumed by `<Toaster />`; most callers ignore it).
 */
export function useToast(): {
  toast: (message: string, variant?: ToastVariant) => void;
  toasts: Toast[];
} {
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
}
