import { describe, expect, it } from 'vitest';

import { isNcAuthenticatedUrl } from '../../src/domains/registrars/namecheap/dashboard/authUrl';

describe('isNcAuthenticatedUrl', () => {
  it('rejects login page even when ReturnUrl points at ap.www', () => {
    const loginUrl =
      'https://www.namecheap.com/myaccount/login-signup/?ReturnUrl=https%3A%2F%2Fap.www.namecheap.com%2Fsettings%2Ftools%2Fapiaccess%2F';
    expect(isNcAuthenticatedUrl(loginUrl)).toBe(false);
  });

  it('accepts api access dashboard', () => {
    expect(isNcAuthenticatedUrl('https://ap.www.namecheap.com/settings/tools/apiaccess/')).toBe(
      true,
    );
  });
});
