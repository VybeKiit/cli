/**
 * Openable vibe-coder scenarios for visual dogfood.
 * Visit `/?fixture=1&scenario=<id>` to auto-run and watch Live work cards hit 100%.
 */

export type OpenableScenario = {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly domains: readonly string[];
  /** Primary brand for list logo (neon, stripe, lemon squeezy, …). */
  readonly provider?: string;
  /** CRUD resource for logo (orders → Lemon Squeezy). */
  readonly resource?: string;
  /**
   * All brands to show for multi-action scenarios (Neon + Stripe + Cloudflare).
   * When omitted, falls back to [provider] or [resource] or domain defaults.
   */
  readonly brands?: readonly string[];
};

/**
 * Tokens used for list / stack logos on a scenario row.
 *
 * @param scenario - Openable scenario.
 * @returns Brand tokens for ProviderMarkStack.
 * @example
 * scenarioBrandTokens({ brands: ['neon', 'stripe'], domains: [] })
 */
export const scenarioBrandTokens = (scenario: OpenableScenario): readonly string[] => {
  if (scenario.brands !== undefined && scenario.brands.length > 0) {
    return scenario.brands;
  }
  if (scenario.provider !== undefined) {
    return [scenario.provider];
  }
  if (scenario.resource !== undefined) {
    return [scenario.resource];
  }
  return scenario.domains;
};

/** Every scenario a maintainer can open and confirm end-to-end on the rail. */
export const OPENABLE_SCENARIOS: readonly OpenableScenario[] = [
  {
    id: 'neon',
    label: 'Neon database + ready checks',
    prompt: 'create neon database with ready feature checks',
    domains: ['database'],
    provider: 'neon',
    brands: ['neon'],
  },
  {
    id: 'supabase',
    label: 'Supabase database',
    prompt: 'wire supabase database',
    domains: ['database'],
    provider: 'supabase',
    brands: ['supabase'],
  },
  {
    id: 'auth-google',
    label: 'Google sign-in',
    prompt: 'add google sign-in and auth for my app',
    domains: ['auth'],
    provider: 'google',
    brands: ['google'],
  },
  {
    id: 'stripe',
    label: 'Stripe payments + checkout',
    prompt: 'setup stripe payments and checkout',
    domains: ['payments'],
    provider: 'stripe',
    brands: ['stripe'],
  },
  {
    id: 'lemon',
    label: 'Lemon Squeezy take money',
    prompt: 'take money with lemon squeezy',
    domains: ['payments'],
    provider: 'lemon squeezy',
    brands: ['lemon squeezy'],
  },
  {
    id: 'crud-orders',
    label: 'CRUD for orders',
    prompt: 'add crud for orders',
    domains: ['crud'],
    resource: 'orders',
    /** Commerce → Lemon Squeezy (kit payments default). */
    brands: ['lemon squeezy'],
  },
  {
    id: 'cloudflare',
    label: 'Deploy index.html to Cloudflare',
    prompt: 'deploy index.html to cloudflare pages',
    domains: ['deploy'],
    provider: 'cloudflare',
    brands: ['cloudflare'],
  },
  {
    id: 'vercel',
    label: 'Deploy to Vercel',
    prompt: 'deploy to vercel production',
    domains: ['deploy'],
    provider: 'vercel',
    brands: ['vercel'],
  },
  {
    id: 'render',
    label: 'Deploy to Render',
    prompt: 'deploy basic index.html to render',
    domains: ['deploy'],
    provider: 'render',
    brands: ['render'],
  },
  {
    id: 'railway',
    label: 'Deploy to Railway',
    prompt: 'deploy to railway',
    domains: ['deploy'],
    provider: 'railway',
    brands: ['railway'],
  },
  {
    id: 'combo',
    label: 'Neon + Stripe + Cloudflare',
    prompt: 'wire neon database, stripe payments, and deploy to cloudflare',
    domains: ['database', 'payments', 'deploy'],
    provider: 'neon',
    brands: ['neon', 'stripe', 'cloudflare'],
  },
  {
    id: 'saas',
    label: 'Full SaaS (auth + data + pay + deploy)',
    prompt: 'add google sign-in, neon database, stripe payments, and deploy to cloudflare',
    domains: ['auth', 'database', 'payments', 'deploy'],
    provider: 'neon',
    brands: ['google', 'neon', 'stripe', 'cloudflare'],
  },
];

/**
 * Resolve a scenario id from the catalog.
 *
 * @param id - Scenario id (case-insensitive).
 * @returns Scenario or undefined.
 * @example
 * getOpenableScenario('neon')?.prompt
 */
export const getOpenableScenario = (id: string): OpenableScenario | undefined => {
  const needle = id.trim().toLowerCase();
  return OPENABLE_SCENARIOS.find((s) => s.id === needle);
};

/**
 * Parse `scenario` query param from a search string.
 *
 * @param search - window.location.search.
 * @returns Scenario id or null.
 * @example
 * scenarioIdFromSearch('?fixture=1&scenario=stripe') // 'stripe'
 */
export const scenarioIdFromSearch = (search: string): string | null => {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const raw = params.get('scenario');
    if (raw === null || raw.trim() === '') {
      return null;
    }
    return raw.trim().toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Absolute local-dev URL for one openable scenario.
 *
 * @param id - Scenario id.
 * @param port - Dev server port (default 3005).
 * @returns URL string.
 * @example
 * openableScenarioUrl('neon') // 'http://localhost:3005/?fixture=1&scenario=neon'
 */
export const openableScenarioUrl = (id: string, port = 3005): string =>
  `http://localhost:${port}/?fixture=1&scenario=${encodeURIComponent(id)}`;
