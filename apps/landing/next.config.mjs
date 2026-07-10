/**
 * Next.js config for the VybeKiit store (apps/landing).
 * Transpiles the workspace `@vybekiit/*` packages so the store runs the same code
 * a buyer's scaffolded app does — proof the kit works (it dogfoods `templates/web`).
 * Wrapped with `withSentryConfig` for source maps + tunnel route.
 * @type {import('next').NextConfig}
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const webSrc = path.join(rootDir, 'templates/web/src');
const webRoot = path.join(rootDir, 'templates/web');
const envPath = path.join(rootDir, '.env');

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        if (process.env[key] === undefined) {
          let value = trimmed.slice(eq + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  // Isolated build dir for local preview so concurrent turbo/next build jobs that
  // wipe `.next` do not hang the storefront (LANDING_DIST_DIR=.next-prod-3003).
  ...(process.env.LANDING_DIST_DIR ? { distDir: process.env.LANDING_DIST_DIR } : {}),
  // Dev: never let the browser keep a stale HTML/JS/CSS shell after a rebuild.
  // Prod keeps Next/CDN defaults (this only applies when next dev is running).
  ...(isDev
    ? {
        generateEtags: false,
        headers: async () => [
          {
            source: '/:path*',
            headers: [
              {
                key: 'Cache-Control',
                value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              },
              { key: 'Pragma', value: 'no-cache' },
              { key: 'Expires', value: '0' },
            ],
          },
        ],
      }
    : {}),
  experimental: {
    externalDir: true,
    // Tree-shake barrel imports (lucide, Radix) so mobile first-load stays lean.
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      'simple-icons',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-e43389539f974d69b9ec3c1fb0f08dd6.r2.dev',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: [
    '@vybekiit/analytics',
    '@vybekiit/assistant-chat',
    '@vybekiit/core',
    '@vybekiit/payments',
    '@vybekiit/report-mode',
  ],
  serverExternalPackages: ['@sentry/node', '@sentry/nextjs'],
  // Prefer smaller client bundles on the marketing storefront.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  webpack: (config, { webpack }) => {
    const currentAlias = config.resolve.alias === undefined ? {} : config.resolve.alias;
    const currentModules =
      config.resolve.modules === undefined ? ['node_modules'] : config.resolve.modules;

    config.resolve.alias = {
      ...currentAlias,
      '@vybekiit-template-web': webSrc,
    };
    config.resolve.modules = [
      path.join(webRoot, 'node_modules'),
      path.join(__dirname, 'node_modules'),
      ...currentModules,
    ];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^@\/(.*)$/, (resource) => {
        const context = resource.context;
        if (
          context !== undefined &&
          context.includes(`${path.sep}templates${path.sep}web${path.sep}`)
        ) {
          resource.request = path.join(webSrc, resource.request.slice(2));
        }
      }),
    );
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry SaaS project: individual-kl / vybekiit
  // Source map upload needs SENTRY_AUTH_TOKEN (local or CI). Without it, builds still succeed.
  org: process.env.SENTRY_ORG ?? 'individual-kl',
  project: process.env.SENTRY_PROJECT ?? 'vybekiit',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload a wider set of client source files for better stack traces
  widenClientFileUpload: true,

  // Proxy browser events through the Next server to bypass ad-blockers
  tunnelRoute: '/monitoring',

  // Suppress non-CI source-map upload noise
  silent: !process.env.CI,
});

// Enables the Cloudflare bindings/context during `next dev` (OpenNext adapter).
// Skip with SKIP_OPENNEXT_DEV=1 when you only need the marketing UI (avoids workerd hang).
if (process.env.SKIP_OPENNEXT_DEV !== '1') {
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare');
  initOpenNextCloudflareForDev();
}
