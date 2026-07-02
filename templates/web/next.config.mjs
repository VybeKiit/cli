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
    '@vybekiit/assets',
    '@vybekiit/analytics',
    '@vybekiit/notifications',
    '@vybekiit/realtime',
  ],
  // @sentry/node is Node-only. It now arrives via the transpiled @vybekiit/core/observability
  // subpath (was an external dep of the standalone @vybekiit/observability), so keep it a
  // server external — never webpack-bundled — matching its pre-ADR-0025 treatment.
  serverExternalPackages: ['@sentry/node'],
  images: {
    remotePatterns: getNextImageRemotePatterns(process.env),
  },
};

export default withNextIntl(nextConfig);
