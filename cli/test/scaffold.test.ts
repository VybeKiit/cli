import { describe, expect, it } from 'vitest';
import { isTemplateName } from '../src/lib/scaffold';

describe('isTemplateName', () => {
  it('accepts known templates and rejects others', () => {
    expect(isTemplateName('web')).toBe(true);
    expect(isTemplateName('desktop')).toBe(false);
  });
});
