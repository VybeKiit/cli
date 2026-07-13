import type { HostLadderProvider, ProvisionedHost } from './types';

/**
 * Build root `.env` keys for a successful host pin (ADR-0039).
 *
 * @param provisioned - Winner from the ladder / existing host.
 * @returns Key map for HOSTING_PROVIDER (+ optional project ids).
 * @example
 * buildHostPinKeys({ provider: 'cloudflare', ephemeral: false });
 */
export const buildHostPinKeys = (provisioned: ProvisionedHost): Record<string, string> => {
  const pin: Record<string, string> = {
    HOSTING_PROVIDER: provisioned.provider,
  };
  if (typeof provisioned.projectId === 'string' && provisioned.projectId.length > 0) {
    if (provisioned.provider === 'cloudflare') {
      pin.CLOUDFLARE_PROJECT_NAME = provisioned.projectId;
    } else if (provisioned.provider === 'vercel') {
      pin.VERCEL_PROJECT_ID = provisioned.projectId;
    } else if (provisioned.provider === 'railway') {
      pin.RAILWAY_PROJECT_ID = provisioned.projectId;
    } else if (provisioned.provider === 'render') {
      pin.RENDER_SERVICE_ID = provisioned.projectId;
    } else if (provisioned.provider === 'netlify') {
      pin.NETLIFY_SITE_ID = provisioned.projectId;
    } else if (provisioned.provider === 'github-pages') {
      pin.GITHUB_PAGES_REPO = provisioned.projectId;
    }
  }
  if (typeof provisioned.url === 'string' && provisioned.url.length > 0) {
    pin.APP_URL = provisioned.url;
  }
  return pin;
};

const BRANDS: Record<HostLadderProvider, string> = {
  cloudflare: 'Cloudflare',
  render: 'Render',
  railway: 'Railway',
  vercel: 'Vercel',
  netlify: 'Netlify',
  'github-pages': 'GitHub Pages',
};

/**
 * Display brand for a host ladder provider.
 *
 * @param provider - Ladder provider id.
 * @returns Capitalized vendor name.
 * @example
 * hostBrand('cloudflare') === 'Cloudflare';
 */
export const hostBrand = (provider: HostLadderProvider): string => BRANDS[provider];

/**
 * Plain-language success note after host verify (no env/API jargon).
 *
 * @param provider - Winning host.
 * @param hopped - Whether a free-tier hop occurred.
 * @param fromProvider - Provider left behind when hopped.
 * @returns Buyer-facing message.
 * @example
 * buyerHostSuccessMessage('render', true, 'cloudflare');
 */
export const buyerHostSuccessMessage = (
  provider: HostLadderProvider,
  hopped: boolean,
  fromProvider?: HostLadderProvider,
): string => {
  const brand = hostBrand(provider);
  if (hopped && fromProvider !== undefined) {
    return `${hostBrand(fromProvider)} free plan was full, so we put your app online on ${brand}. It works. You're set.`;
  }
  return `Your app is ready to go online on ${brand}.`;
};
