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
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
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
      ...(config.resolve.modules ?? ['node_modules']),
    ];
    return config;
  },
};

export default nextConfig;
