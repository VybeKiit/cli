'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { cn } from './utils';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface NotificationToastProps {
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly icon?: ReactNode;
  readonly duration?: number;
  readonly onDismiss?: () => void;
  readonly className?: string;
}

const VARIANT_STYLES = {
  success: { bg: 'bg-emerald-500/10 border-emerald-500/30', color: 'text-emerald-300' },
  info: { bg: 'bg-blue-500/10 border-blue-500/30', color: 'text-blue-300' },
  warning: { bg: 'bg-orange-500/10 border-orange-500/30', color: 'text-orange-300' },
  error: { bg: 'bg-red-500/10 border-red-500/30', color: 'text-red-300' },
};

/**
 * Animated notification toast with optional auto-dismiss.
 *
 * @param props - Toast message, variant, icon, duration, dismiss handler, and classes.
 * @returns A dismissible notification toast element.
 * @example
 * <NotificationToast message="Saved" variant="success" />;
 */
export const NotificationToast = (props: NotificationToastProps) => {
  const { message, variant = 'info', icon = null, duration = 4000, onDismiss, className = '' } = props;
  const [visible, setVisible] = useState(true);
  const style = VARIANT_STYLES[variant];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-lg transition-all duration-300',
        style.bg,
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
    >
      {icon}
      <span className={cn('text-sm', style.color)}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="ml-auto rounded p-0.5 text-zinc-500 hover:text-zinc-300"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
