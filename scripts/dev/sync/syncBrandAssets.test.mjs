import { describe, expect, it } from 'vitest';
import { brandAssetHash, readBrandAsset, readSyncedTarget } from './syncBrandAssets.mjs';

describe('sync-brand-assets', () => {
  it('keeps landing favicon aligned with SSOT', async () => {
    const icon = await readBrandAsset('vybekiit-icon.svg');
    const landingIcon = await readSyncedTarget('apps/landing/app/icon.svg');
    expect(brandAssetHash(landingIcon)).toBe(brandAssetHash(icon));
  });

  it('keeps app and template icons aligned with SSOT', async () => {
    const icon = await readBrandAsset('vybekiit-icon.svg');

    const iconTargets = [
      'apps/componentLibrary/app/icon.svg',
      'templates/web/app/icon.svg',
      'templates/web/public/logo.svg',
      'templates/extension/public/icon/icon.svg',
      'templates/mobile/assets/icon.svg',
      'templates/spa/public/favicon.svg',
      'templates/spa/public/images/logo/logo-icon.svg',
    ];

    for (const target of iconTargets) {
      expect(brandAssetHash(await readSyncedTarget(target))).toBe(brandAssetHash(icon));
    }
  });

  it('keeps transparent logo aligned with SSOT', async () => {
    const logo = await readBrandAsset('vybekiit-logo.svg');

    const logoTargets = [
      'apps/landing/public/vybekiit-logo.svg',
      'apps/localDevelopmentWebsite/public/vybekiit-logo.svg',
      'templates/web/public/vybekiit-logo.svg',
      'templates/extension/public/vybekiit-logo.svg',
    ];

    for (const target of logoTargets) {
      expect(brandAssetHash(await readSyncedTarget(target))).toBe(brandAssetHash(logo));
    }
  });

  it('keeps profile logo aligned with SSOT', async () => {
    const profileLogo = await readBrandAsset('vybekiit-profile.svg');
    expect(brandAssetHash(await readSyncedTarget('apps/landing/public/vybekiit-profile.svg'))).toBe(
      brandAssetHash(profileLogo),
    );
  });

  it('keeps SPA wordmarks aligned with SSOT variants', async () => {
    const lightWordmark = await readBrandAsset('vybekiit-wordmark-dark.svg');
    const darkWordmark = await readBrandAsset('vybekiit-wordmark.svg');

    const spaLightLogo = await readSyncedTarget('templates/spa/public/images/logo/logo.svg');
    expect(brandAssetHash(spaLightLogo)).toBe(brandAssetHash(lightWordmark));
    expect(
      brandAssetHash(await readSyncedTarget('templates/spa/public/images/logo/logo-dark.svg')),
    ).toBe(brandAssetHash(darkWordmark));
  });
});
