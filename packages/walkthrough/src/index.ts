import type { WalkthroughStep } from './types';

export * from './types';

/**
 * Whether a step spotlights a specific page element (it has a `target`) instead of
 * centering an anchorless dialog. Framework-free and DOM-free, so non-web consumers
 * can branch on a step's shape without importing the React entry.
 *
 * @param step - A walkthrough step.
 * @returns True when the step targets a page element; false for a centered step.
 * @example
 * isAnchoredStep({ id: 'search', title: 'T', body: 'B', target: '#search' }) === true;
 */
export const isAnchoredStep = (step: WalkthroughStep): boolean => step.target !== undefined;
