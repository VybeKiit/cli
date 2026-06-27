/**
 * Public surface of `@vybekiit/browser-automation`.
 *
 * The callable verb allowlist lives in `CWS_AUTOMATION_VERBS` per ADR-0012.
 * Helper exports below are available for tooling, but they are not CWS verbs.
 * Adding a verb is a typed code change with PR review; in particular, no destructive verb
 * (matching `/remove|delete|unpublish|reset|cancel review|transfer/i`)
 * may be added without amending ADR-0012.
 *
 * READ verbs have no side effects.
 * PUSH verbs run `pnpm verify:release` for the target extension before
 * touching CWS, and route every click through `safeClick` so the
 * destructive-name guard runs as a second line of defence.
 */

// Infrastructure exports (not part of the verb allowlist — these are
// shared helpers for tooling like the selector recorder and the e2e
// dry-run probe that need to drive a CDP-attached page without going
// through a verb).
export { connectToCwsChrome } from './connect';
export { diffListing } from './diff';
export type { ListingFieldDiff } from './diff';
// Error classes — exported so callers can switch on `instanceof`.
export {
  CdpUnreachableError,
  DestructiveClickRefusedError,
  DriftDetectedError,
  MissingItemIdError,
  SelectorMissingError,
  VerifyGateFailedError,
} from './errors';

export { CWS_ALL_REGIONS, isCwsAllRegions } from './regions';
export type { CwsListing } from './schema';
export { CwsListingSchema } from './schema';
// Types and schema for callers (CLI, agents, tests).
export type { AttachedSession, ExtensionConfig, VerbContext } from './types';
export { discoverDeveloperGroupId, listingUrl } from './urls';
export {
  CWS_AUTOMATION_PUSH_VERBS,
  CWS_AUTOMATION_READ_VERBS,
  CWS_AUTOMATION_VERBS,
  CWS_DESTRUCTIVE_VERB_PATTERN,
  type CwsAutomationPushVerb,
  type CwsAutomationReadVerb,
  type CwsAutomationVerb,
} from './verbRegistry';
export { createNewItem } from './verbs/createNewItem';

// Push verbs
export { importListing } from './verbs/importListing';
export { publish } from './verbs/publish';
// Read verbs
export { readListingState } from './verbs/readListingState';

export { readReviewStatus } from './verbs/readReviewStatus';
export type { CwsReviewStatus } from './verbs/readReviewStatus';
export { readVersionHistory } from './verbs/readVersionHistory';
export type { CwsVersionRow } from './verbs/readVersionHistory';
export { readViolations } from './verbs/readViolations';
export type { CwsViolation } from './verbs/readViolations';
export { submitForReview } from './verbs/submitForReview';
export { applyTabChanges, updateListing } from './verbs/updateListing';
export { uploadPackage, type UploadPackageResult } from './verbs/uploadPackage';
