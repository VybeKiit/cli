/** Lemon Squeezy verbs that only read dashboard state. */
export const LS_AUTOMATION_READ_VERBS = ['readDashboardIds', 'readWebhookState'] as const;

/** Lemon Squeezy verbs that create or update dashboard state. */
export const LS_AUTOMATION_PUSH_VERBS = ['createProduct', 'uploadProductImage'] as const;

/** Provisioned via LS REST API after first API key exists (see api/provision.ts). */
export const LS_AUTOMATION_API_VERBS = ['createApiKey', 'configureWebhook'] as const;

/** All supported Lemon Squeezy automation verb names. */
export const LS_AUTOMATION_VERBS = [
  'standbyLogin',
  ...LS_AUTOMATION_READ_VERBS,
  ...LS_AUTOMATION_PUSH_VERBS,
  ...LS_AUTOMATION_API_VERBS,
] as const;

// `delete subscription` -> destructive.
export const LS_DESTRUCTIVE_VERB_PATTERN =
  /remove|delete|refund|payout|cancel\s*subscription|archive\s*store/i;

/** Lemon Squeezy read-only automation verb. */
export type LsAutomationReadVerb = (typeof LS_AUTOMATION_READ_VERBS)[number];
/** Lemon Squeezy dashboard mutation automation verb. */
export type LsAutomationPushVerb = (typeof LS_AUTOMATION_PUSH_VERBS)[number];
/** Any supported Lemon Squeezy automation verb. */
export type LsAutomationVerb = (typeof LS_AUTOMATION_VERBS)[number];
