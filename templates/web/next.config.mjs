/**
 * Next.js config for a VybeKiit web app.
 * Transpiles the workspace `@vybekiit/*` packages so a scaffolded app works the
 * same whether it consumes them from the workspace (dev) or from npm (buyer).
 * @type {import('next').NextConfig}
 */
import { getNextImageRemotePatterns } from '@vybekiit/assets';
import createNextIntlPlugin from 'next-intl/plugin';
import process from 'node:process';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  transpilePackages: [
    '@vybekiit/core',
    '@vybekiit/auth',
    '@vybekiit/db',
    '@vybekiit/payments',
    '@vybekiit/security',
    '@vybekiit/assets',
    '@vybekiit/analytics',
    '@vybekiit/ai',
    '@vybekiit/cms',
    '@vybekiit/compliance',
    '@vybekiit/i18n',
    '@vybekiit/jobs',
    '@vybekiit/kv',
    '@vybekiit/notifications',
    '@vybekiit/realtime',
    '@vybekiit/search',
    '@vybekiit/seo',
    '@vybekiit/tenancy',
  ],
  images: {
    remotePatterns: getNextImageRemotePatterns(process.env),
  },
};

export default withNextIntl(nextConfig);
