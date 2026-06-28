/**
 * Next.js config for a VybeKiit web app.
 * Transpiles the workspace `@vybekiit/*` packages so a scaffolded app works the
 * same whether it consumes them from the workspace (dev) or from npm (buyer).
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  transpilePackages: [
    '@vybekiit/core',
    '@vybekiit/auth',
    '@vybekiit/db',
    '@vybekiit/payments',
    '@vybekiit/security',
  ],
};

export default nextConfig;
