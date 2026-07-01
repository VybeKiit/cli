import { describe, expect, it } from 'vitest';

import {
  CWS_AUTOMATION_PUSH_VERBS,
  CWS_AUTOMATION_READ_VERBS,
  CWS_AUTOMATION_VERBS,
  CWS_DESTRUCTIVE_VERB_PATTERN,
} from '../verbRegistry';

describe('CWS automation verb registry', () => {
  it('exposes the documented read verbs', () => {
    expect(CWS_AUTOMATION_READ_VERBS).toEqual([
      'readListingState',
      'readViolations',
      'readReviewStatus',
      'readVersionHistory',
    ]);
  });

  it('exposes the documented push verbs', () => {
    expect(CWS_AUTOMATION_PUSH_VERBS).toEqual([
      'importListing',
      'updateListing',
      'createNewItem',
      'uploadPackage',
      'submitForReview',
      'publish',
    ]);
  });

  it('does not expose destructive verbs', () => {
    expect(CWS_AUTOMATION_VERBS.filter((verb) => CWS_DESTRUCTIVE_VERB_PATTERN.test(verb))).toEqual(
      [],
    );
  });

  it.each([
    'remove',
    'delete',
    'unpublish',
    'reset',
    'cancelReview',
    'cancel review',
    'cancelSubmission',
    'cancel submission',
    'transferOwnership',
    'transfer ownership',
    'withdraw',
  ])('blocks destructive name fragment %s', (name) => {
    expect(CWS_DESTRUCTIVE_VERB_PATTERN.test(name)).toBe(true);
  });
});
