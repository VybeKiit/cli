import type { FC, ReactNode } from 'react';
import { twMerge } from 'cnfast';
import { clsx } from 'cnfast';

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export const Label: FC<LabelProps> = ({ htmlFor, children, className }) => (
  <label
    htmlFor={htmlFor}
    className={clsx(
      twMerge('mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400', className),
    )}
  >
    {children}
  </label>
);
