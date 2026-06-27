/**
 * Next.js config for the VybeKiit store (apps/landing).
 * Transpiles the workspace `@vybekiit/*` packages so the store runs the same code
 * a buyer's scaffolded app does — proof the kit works (it dogfoods `templates/web`).
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  transpilePackages: ['@vybekiit/core', '@vybekiit/payments', '@vybekiit/tokens'],
};

export default nextConfig;
