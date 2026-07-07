import { cn as mergeClassNames } from 'cnfast';

/**
 * Merge conditional class names, de-duplicating conflicting Tailwind utilities.
 *
 * @param inputs - Class names and conditional class values accepted by `cnfast`.
 * @returns A normalized className string.
 * @example
 * cn('px-2', active && 'bg-primary');
 */
export const cn = mergeClassNames;
