/**
 * Next.js config for a VybeKiit web app.
 * Transpiles the workspace `@vybekiit/*` spine packages so a scaffolded app works the
 * same whether it consumes them from the workspace (dev) or from npm (buyer). The asset
 * image-pattern helper is now template-owned code (ADR-0025); it is imported by relative
 * path (not the `@/` alias) because Next compiles this config file outside tsconfig paths,
 * and from its own file (not the barrel) so the Node-only sharp/svgo optimizer never enters
 * the config graph.
 */
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import process from 'node:process';
import { getNextImageRemotePatterns } from './src/vybekiit/assets/next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: [
    '@vybekiit/core',
    '@vybekiit/auth',
    '@vybekiit/db',
    '@vybekiit/payments',
    '@vybekiit/notifications',
  ],
  // @sentry/node is Node-only. It arrives via the transpiled @vybekiit/core/observability
  // subpath, so keep it a server external — never webpack-bundled.
  serverExternalPackages: ['@sentry/node'],
  images: {
    remotePatterns: getNextImageRemotePatterns(process.env),
  },
};

export default withNextIntl(nextConfig);
