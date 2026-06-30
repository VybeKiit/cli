import type { ReactNode } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: ReactNode;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'outline';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/** TailAdmin button API backed by shadcn `Button`. */
export default function Button({
  children,
  size = 'md',
  variant = 'primary',
  startIcon,
  endIcon,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  return (
    <ShadcnButton
      type={type}
      size={size === 'sm' ? 'sm' : 'default'}
      variant={variant === 'outline' ? 'outline' : 'default'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        variant === 'primary' &&
          'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300',
        'rounded-lg',
        className,
      )}
    >
      {startIcon ? <span className="flex items-center">{startIcon}</span> : null}
      {children}
      {endIcon ? <span className="flex items-center">{endIcon}</span> : null}
    </ShadcnButton>
  );
}
