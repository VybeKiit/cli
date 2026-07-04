import { describe, expect, it } from 'vitest';
import { brandAssetHash, readBrandAsset, readSyncedTarget } from './syncBrandAssets.mjs';

describe('sync-brand-assets', () => {
  it('keeps landing favicon aligned with SSOT', async () => {
    const icon = await readBrandAsset('vybekiit-icon.svg');
    const landingIcon = await readSyncedTarget('apps/landing/app/icon.svg');
    expect(brandAssetHash(landingIcon)).toBe(brandAssetHash(icon));
  });

  it('keeps component library favicon aligned with SSOT', async () => {
    const icon = await readBrandAsset('vybekiit-icon.svg');
    const libraryIcon = await readSyncedTarget('apps/componentLibrary/app/icon.svg');
    expect(brandAssetHash(libraryIcon)).toBe(brandAssetHash(icon));
  });

  it('keeps transparent logo aligned with SSOT', async () => {
    const logo = await readBrandAsset('vybekiit-logo.svg');
    const landingLogo = await readSyncedTarget('apps/landing/public/vybekiit-logo.svg');
    expect(brandAssetHash(landingLogo)).toBe(brandAssetHash(logo));
  });
});
