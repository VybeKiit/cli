/**
 * Next.js config for the mobile-app landing page (apps/mobileAppLandingPage).
 *
 * A static marketing site that reuses first-party UI from `@vybekiit/ui` and
 * mirrored blocks under `templates/web` (device mockups, app-store buttons). No
 * Sentry, D1, or payments — this page never talks to a backend.
 * @type {import('next').NextConfig}
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const nextConfig = {
  // @vybekiit/ui ships raw .tsx; transpile it so Next compiles the source.
  transpilePackages: ['@vybekiit/ui'],
  experimental: {
    externalDir: true,
    // Tree-shake barrel imports (lucide, Radix, simple-icons) so first-load stays lean.
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

export default nextConfig;

// Enables the Cloudflare bindings/context during `next dev` (OpenNext adapter).
// Skip with SKIP_OPENNEXT_DEV=1 when you only need the marketing UI (avoids workerd hang).
if (process.env.SKIP_OPENNEXT_DEV !== '1') {
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare');
  initOpenNextCloudflareForDev();
}
