import { cn as mergeClassNames } from 'cnfast';

/**
 * Merge conditional class names, de-duplicating conflicting Tailwind utilities.
 *
 * @param values - Class values accepted by `cnfast`.
 * @returns A merged class string safe to pass to `className`.
 * @example
 * cn('px-2', active && 'bg-primary');
 */
export const cn = mergeClassNames;
