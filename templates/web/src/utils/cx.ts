import { cn } from '@/lib/utils';

/**
 * Alias for shared class-name merging in older template code.
 *
 * @param inputs - Class names and conditional class values accepted by `cnfast`.
 * @returns A normalized className string.
 * @example
 * cx('px-2', active && 'bg-primary');
 */
export const cx = cn;
