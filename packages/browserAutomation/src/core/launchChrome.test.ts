import { describe, expect, it } from 'vitest';

import { getChromeUserDataDirForPort } from './launchChrome';

describe('getChromeUserDataDirForPort', () => {
  it('returns null when no matching Chrome process exists', () => {
    expect(getChromeUserDataDirForPort(59_999)).toBeNull();
  });

  it('reads user-data-dir from a live registrar Chrome when running', () => {
    const nc = getChromeUserDataDirForPort(9223);
    const gd = getChromeUserDataDirForPort(9224);
    if (nc) expect(nc).toMatch(/\.nc-chrome-profile$/);
    if (gd) expect(gd).toMatch(/\.gd-chrome-profile$/);
  });
});
