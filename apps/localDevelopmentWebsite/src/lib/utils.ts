import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class values with Tailwind conflict resolution.
 *
 * @param inputs - Class values passed to clsx before Tailwind merging.
 * @returns A merged class name string.
 * @example
 * const className = cn('flex', active && 'text-emerald-400');
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
