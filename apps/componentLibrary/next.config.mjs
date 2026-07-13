/**
 * Component library browser — imports mirrored blocks from templates/web (SSOT).
 * @type {import('next').NextConfig}
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.join(__dirname, '../../templates/web/src');
const webRoot = path.join(__dirname, '../../templates/web');

const nextConfig = {
  experimental: {
    externalDir: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    const existingAlias = config.resolve.alias === undefined ? {} : config.resolve.alias;
    const existingModules =
      config.resolve.modules === undefined ? ['node_modules'] : config.resolve.modules;

    config.resolve.alias = {
      ...existingAlias,
      '@/utils/cn': path.join(webSrc, 'lib/utils.ts'),
      '@/registry/default/ui': path.join(webSrc, 'registry/default/ui'),
      '@/registry/new-york/ui': path.join(webSrc, 'registry/new-york/ui'),
      '@repo/shadcn-ui/lib/utils': path.join(webSrc, 'lib/utils.ts'),
      '@repo/shadcn-ui/components/ui': path.join(webSrc, 'components/ui'),
      'react-native$': 'react-native-web',
      '@/': `${webSrc}/`,
    };
    config.resolve.modules = [
      path.join(webRoot, 'node_modules'),
      path.join(__dirname, 'node_modules'),
      ...existingModules,
    ];

    // Dev-only: compile dynamically-imported modules on first request instead of eagerly
    // with the route. The design-system `[slug]` route references a registry of ~51 lazy
    // per-primitive story chunks (recharts/embla/cmdk/vaul/day-picker); without this, webpack
    // compiles all ~4.4k modules on the first design-system visit. With it, only the visited
    // primitive's chunk compiles. Client build only (the story galleries are `ssr:false`).
    if (dev && !isServer) {
      config.experiments = {
        ...(config.experiments ?? {}),
        lazyCompilation: { entries: false, imports: true },
      };
    }
    return config;
  },
};

export default nextConfig;
