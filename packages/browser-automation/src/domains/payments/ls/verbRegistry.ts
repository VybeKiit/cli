export const LS_AUTOMATION_READ_VERBS = ['readDashboardIds', 'readWebhookState'] as const;

export const LS_AUTOMATION_PUSH_VERBS = [
  'createProduct',
  'uploadProductImage',
] as const;

/** Provisioned via LS REST API after first API key exists (see api/provision.ts). */
export const LS_AUTOMATION_API_VERBS = ['createApiKey', 'configureWebhook'] as const;

export const LS_AUTOMATION_VERBS = [
  'standbyLogin',
  ...LS_AUTOMATION_READ_VERBS,
  ...LS_AUTOMATION_PUSH_VERBS,
  ...LS_AUTOMATION_API_VERBS,
] as const;

export const LS_DESTRUCTIVE_VERB_PATTERN =
  /remove|delete|refund|payout|cancel\s*subscription|archive\s*store/i;

export type LsAutomationReadVerb = (typeof LS_AUTOMATION_READ_VERBS)[number];
export type LsAutomationPushVerb = (typeof LS_AUTOMATION_PUSH_VERBS)[number];
export type LsAutomationVerb = (typeof LS_AUTOMATION_VERBS)[number];
