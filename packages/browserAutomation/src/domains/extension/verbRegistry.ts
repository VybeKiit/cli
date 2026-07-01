/**
 * Callable Chrome Web Store automation verbs.
 *
 * Helper exports from `index.ts` are intentionally not part of this list.
 * ADR-0012's safety contract is this explicit registry plus the CLI
 * subcommands that invoke these functions.
 */
export const CWS_AUTOMATION_READ_VERBS = [
  'readListingState',
  'readViolations',
  'readReviewStatus',
  'readVersionHistory',
] as const;

/**
 * Single source of truth for cws automation push verbs across Chrome Web Store automation callers.
 */
export const CWS_AUTOMATION_PUSH_VERBS = [
  'importListing',
  'updateListing',
  'createNewItem',
  'uploadPackage',
  'submitForReview',
  'publish',
] as const;

/**
 * Single source of truth for cws automation verbs across Chrome Web Store automation callers.
 */
export const CWS_AUTOMATION_VERBS = [
  ...CWS_AUTOMATION_READ_VERBS,
  ...CWS_AUTOMATION_PUSH_VERBS,
] as const;

/**
 * Single source of truth for cws destructive verb pattern across Chrome Web Store automation callers.
 */
export const CWS_DESTRUCTIVE_VERB_PATTERN =
  /remove|delete|unpublish|reset|cancel\s*(review|submission)|transfer\s*(ownership)?|withdraw/i;

/**
 * Public contract for cws automation push verb at the Chrome Web Store automation module boundary.
 */
export type CwsAutomationPushVerb = (typeof CWS_AUTOMATION_PUSH_VERBS)[number];
/**
 * Public contract for cws automation read verb at the Chrome Web Store automation module boundary.
 */
export type CwsAutomationReadVerb = (typeof CWS_AUTOMATION_READ_VERBS)[number];
/**
 * Public contract for cws automation verb at the Chrome Web Store automation module boundary.
 */
export type CwsAutomationVerb = (typeof CWS_AUTOMATION_VERBS)[number];
