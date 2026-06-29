import { describe, expect, it } from 'vitest';

import { CWS_DRAFT_FIELDS, LS_DRAFT_FIELDS } from '../../dev/recorder/shared/fields';
import { parseDraft, parseExpression } from '../../dev/recorder/shared/draft';

describe('parseExpression', () => {
  it('parses getByRole', () => {
    expect(parseExpression("page.getByRole('textbox', { name: 'Item name' })", 1)).toEqual({
      kind: 'role',
      role: 'textbox',
      name: 'Item name',
    });
  });

  it('parses locator css', () => {
    expect(parseExpression("locator('#foo')", 2)).toEqual({ kind: 'css', selector: '#foo' });
  });

  it('rejects unknown shapes', () => {
    expect(() => parseExpression('querySelector("#x")', 3)).toThrow(/cannot parse/);
  });
});

describe('parseDraft', () => {
  it('skips blank values and comments', () => {
    const raw = `
# comment
listing.description = getByLabel('Description')
listing.supportUrl =
`;
    const out = parseDraft(raw, CWS_DRAFT_FIELDS);
    expect(out['listing.description']).toEqual({ kind: 'label', text: 'Description' });
    expect(out['listing.supportUrl']).toBeUndefined();
  });

  it('rejects unknown keys', () => {
    expect(() => parseDraft('unknown.field = locator("x")', CWS_DRAFT_FIELDS)).toThrow(/unknown field key/);
  });

  it('accepts ls draft fields', () => {
    const out = parseDraft('product.nameInput = getByPlaceholder("Name")', LS_DRAFT_FIELDS);
    expect(out['product.nameInput']).toEqual({ kind: 'placeholder', text: 'Name' });
  });
});
