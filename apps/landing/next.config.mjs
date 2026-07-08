/**
 * Next.js config for the VybeKiit store (apps/landing).
 * Transpiles the workspace `@vybekiit/*` packages so the store runs the same code
 * a buyer's scaffolded app does — proof the kit works (it dogfoods `templates/web`).
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
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    '@vybekiit/assistant-chat',
    '@vybekiit/core',
    '@vybekiit/payments',
    '@vybekiit/report-mode',
  ],
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
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();
