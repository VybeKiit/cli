/**
 * VybeKiit edge security Worker — the COMPLEMENTARY layer to `@vybekiit/security`.
 *
 * The app-layer guard (`packages/security`) is a per-instance, in-memory limiter: it
 * protects one Worker/serverless instance. This Worker runs at the Cloudflare edge in
 * front of the app and caps *distributed* abuse — many IPs, or one IP fanned across
 * instances — before it ever reaches origin. The two layers are intentionally
 * redundant-by-design, not duplicated logic: they read the **same** env toggles
 * (`SECURITY_*`, the core `securityConfigSchema` SSOT), so a rule can never mean one
 * thing at the edge and another in the app.
 *
 * Mirrored policy shape (identical to `SecurityGuard.evaluate`):
 *   1. Origin lock first — only on state-changing methods (POST/PUT/PATCH/DELETE);
 *      safe reads (GET/HEAD/OPTIONS) are never blocked on origin, matching browsers.
 *   2. Per-client fixed-window rate limit, keyed on `CF-Connecting-IP` (the edge's
 *      trustworthy client IP), max + window from env.
 * Either failing check short-circuits with a plain-language body and the right status,
 * so a blocked request looks the same whether the edge or the app rejected it.
 *
 * Dependency-free by design: it uses only standard Workers runtime globals (`Request`,
 * `Response`, `Headers`, `URL`, `fetch`), no npm packages and no
 * `@cloudflare/workers-types` (the kit avoids adding a build/type dependency just for
 * this skeleton — see `infra/README.md`). Only the module entrypoint shape is declared
 * locally below, kept deliberately minimal and type-safe.
 *
 * Distributed counting note: per-isolate `Map` state only spans one edge location's
 * isolate, so this is a meaningful-but-not-global cap on its own. When a buyer needs a
 * strict cross-edge limit, the env toggles also drive a Cloudflare rate-limiting
 * Ruleset (see `wrangler.toml` + the documented ruleset shape) — same `_MAX`/`_WINDOW`,
 * enforced in Cloudflare's network rather than in JS. This Worker is the programmable
 * mirror of the app policy; the Ruleset is the heavy distributed cap.
 */

/**
 * Minimal local type for the ES-module Worker entrypoint this file exports.
 *
 * Why declared here instead of `@cloudflare/workers-types`: the kit keeps `infra/`
 * dependency-free, and pulling a types-only package in just for a skeleton Worker adds
 * install + maintenance surface for no runtime gain. This mirrors the real
 * `ExportedHandler` shape closely enough to stay strict-clean; swap in the official
 * types if a buyer grows this Worker into a full build. The handler receives `env` as
 * a typed argument (no `globalThis` cast), so the module format is also the safer one.
 */
interface ExportedWorker {
  fetch(request: Request, env: EdgeSecurityEnv): Promise<Response>;
}

/**
 * The edge env bindings — the SAME keys as the core `securityConfigSchema`, bound as
 * Worker vars (see `wrangler.toml`). All optional/string because Worker `env` is raw
 * text; {@link resolveEdgePolicy} applies the same safe defaults as the core schema so
 * a blank var means "use the secure default", never "fail open".
 */
interface EdgeSecurityEnv {
  readonly SECURITY_RATE_LIMIT?: string;
  readonly SECURITY_RATE_LIMIT_MAX?: string;
  readonly SECURITY_RATE_LIMIT_AUTH_MAX?: string;
  readonly SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX?: string;
  readonly SECURITY_RATE_LIMIT_WINDOW_SECONDS?: string;
  readonly SECURITY_ORIGIN_LOCK?: string;
  readonly SECURITY_ALLOWED_ORIGINS?: string;
  /** The app's own canonical origin, e.g. `https://myapp.com`; same-origin always passes. */
  readonly APP_URL?: string;
}

/**
 * The resolved edge policy — the env SSOT turned into typed values, structurally the
 * same as `@vybekiit/security`'s `SecurityPolicy` so the two layers stay in lockstep.
 */
interface EdgePolicy {
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly defaultMax: number;
    readonly authMax: number;
    readonly publicFormMax: number;
    readonly windowSeconds: number;
  };
  readonly originLock: { readonly enabled: boolean; readonly allowedOrigins: readonly string[] };
  /** The app's own origin (lowercased, trimmed) the lock checks `Origin` against. */
  readonly appOrigin: string;
}

/** Methods that change no state and need no origin check (safe + idempotent). */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Default auth-strict ceiling, kept in sync with core `securityConfigSchema` (10). */
const DEFAULT_RATE_LIMIT_AUTH_MAX = 10;
/** Default public-form ceiling, kept in sync with core `securityConfigSchema` (30). */
const DEFAULT_RATE_LIMIT_PUBLIC_FORM_MAX = 30;
/** Default rate-limit ceiling, kept in sync with core `securityConfigSchema` (60). */
const DEFAULT_RATE_LIMIT_MAX = 60;
/** Default window in seconds, kept in sync with core `securityConfigSchema` (60). */
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
/** Default app origin, kept in sync with core `DEFAULT_APP_URL`. */
const DEFAULT_APP_ORIGIN = 'http://localhost:3000';

type RouteTier = 'auth-strict' | 'public-form' | 'webhook' | 'default';

/** Mirror of `@vybekiit/security`'s `classifyRoute` — kept inline (dependency-free). */
function classifyRoutePath(pathname: string): RouteTier {
  const p = pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (p === '/api/webhook' || p.startsWith('/api/webhook/')) return 'webhook';
  if (
    p.startsWith('/api/auth/signin') ||
    p.startsWith('/api/auth/signup') ||
    p.startsWith('/api/auth/send-code') ||
    p.startsWith('/api/auth/verify')
  ) {
    return 'auth-strict';
  }
  if (
    p.startsWith('/api/contact') ||
    p.startsWith('/api/waitlist') ||
    p.startsWith('/api/newsletter')
  ) {
    return 'public-form';
  }
  return 'default';
}

function rateLimitMaxForTier(policy: EdgePolicy, tier: RouteTier): number {
  switch (tier) {
    case 'auth-strict':
      return policy.rateLimit.authMax;
    case 'public-form':
      return policy.rateLimit.publicFormMax;
    default:
      return policy.rateLimit.defaultMax;
  }
}

/**
 * Read an `on`/`off` env toggle, defaulting to ON.
 *
 * Mirrors the core schema's secure-by-default stance: only an explicit `off` disables a
 * check, so a missing or garbled var keeps protection on rather than silently opening.
 */
function isToggledOn(value: string | undefined): boolean {
  return value?.trim().toLowerCase() !== 'off';
}

/**
 * Coerce an env string to a positive int, falling back to `fallback` on blank/invalid.
 *
 * Same intent as core's `positiveIntEnv`: a blank line in a copied env means "use the
 * safe default", and a non-positive or non-numeric value never weakens the limit to 0.
 */
function positiveIntOr(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value?.trim() ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Split `SECURITY_ALLOWED_ORIGINS` into a clean, lowercased list.
 *
 * Identical normalization to `@vybekiit/security`'s `parseAllowedOrigins`: trims and
 * drops empties so a trailing comma or all-blank value yields `[]` (same-origin only)
 * rather than an origin that matches everything.
 */
function parseAllowedOrigins(csv: string | undefined): string[] {
  return (csv ?? '')
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter((origin) => origin.length > 0);
}

/** Normalize a URL/origin string to a comparable origin (scheme + host + port), lowercased. */
function toOrigin(value: string): string {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    // Not a full URL (e.g. already an origin or a misconfig) — fall back to the raw,
    // trimmed string so a same-origin equality check can still succeed.
    return value.trim().toLowerCase();
  }
}

/**
 * Turn the raw Worker `env` into a normalized {@link EdgePolicy}.
 *
 * This is the edge twin of `resolveSecurityPolicy` in `@vybekiit/security`: same keys,
 * same defaults, same CSV parsing — so both layers resolve identical rules from one
 * `.env`. Kept pure for easy reasoning; the handler calls it once per request.
 */
function resolveEdgePolicy(env: EdgeSecurityEnv): EdgePolicy {
  return {
    rateLimit: {
      enabled: isToggledOn(env.SECURITY_RATE_LIMIT),
      defaultMax: positiveIntOr(env.SECURITY_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
      authMax: positiveIntOr(env.SECURITY_RATE_LIMIT_AUTH_MAX, DEFAULT_RATE_LIMIT_AUTH_MAX),
      publicFormMax: positiveIntOr(
        env.SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX,
        DEFAULT_RATE_LIMIT_PUBLIC_FORM_MAX,
      ),
      windowSeconds: positiveIntOr(
        env.SECURITY_RATE_LIMIT_WINDOW_SECONDS,
        DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
      ),
    },
    originLock: {
      enabled: isToggledOn(env.SECURITY_ORIGIN_LOCK),
      allowedOrigins: parseAllowedOrigins(env.SECURITY_ALLOWED_ORIGINS),
    },
    appOrigin: toOrigin(env.APP_URL ?? DEFAULT_APP_ORIGIN),
  };
}

/**
 * Decide whether a request's `Origin` passes the same-origin lock.
 *
 * Same rules as `@vybekiit/security`'s `isOriginAllowed`: allow when the lock is off,
 * when no `Origin` header is present (browsers omit it on top-level navigations and
 * same-origin GETs), when it equals the app's own origin, or when it's allow-listed.
 */
function isOriginAllowed(originHeader: string | null, policy: EdgePolicy): boolean {
  if (!policy.originLock.enabled) return true;
  if (originHeader === null) return true;

  const origin = originHeader.trim().toLowerCase();
  if (origin === policy.appOrigin) return true;
  return policy.originLock.allowedOrigins.includes(origin);
}

/** One client's counter within the current fixed window. */
interface WindowState {
  count: number;
  /** Epoch ms when the window ends and the count resets. */
  resetAt: number;
}

/**
 * Per-isolate fixed-window counters, keyed by client IP.
 *
 * Module-scope so counts persist across requests handled by the same isolate (a
 * per-request map would reset everyone every time = no protection). This mirrors the
 * app layer's `RateLimiter`; its scope is one edge isolate, which is why a strict
 * cross-edge cap belongs in the Cloudflare Ruleset (documented in `wrangler.toml`).
 */
const windows = new Map<string, WindowState>();

/** Outcome of a single rate-limit check; a block carries the wait for `Retry-After`. */
type RateLimitResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

function checkRateLimit(
  clientId: string,
  tier: RouteTier,
  policy: EdgePolicy,
  now: number,
): RateLimitResult {
  const max = rateLimitMaxForTier(policy, tier);
  const bucketKey = `${clientId}:${tier}`;
  const existing = windows.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    windows.set(bucketKey, { count: 1, resetAt: now + policy.rateLimit.windowSeconds * 1000 });
    for (const [key, state] of windows) {
      if (now >= state.resetAt) windows.delete(key);
    }
    return { allowed: true };
  }

  if (existing.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true };
}

/** A blocked-request body, kept plain so a non-coder reading logs understands it. */
function blocked(message: string, status: number, retryAfterSeconds?: number): Response {
  const headers = new Headers({ 'content-type': 'text/plain; charset=utf-8' });
  if (retryAfterSeconds !== undefined) headers.set('retry-after', String(retryAfterSeconds));
  return new Response(message, { status, headers });
}

/**
 * Apply the edge security policy to one request, then forward allowed traffic to origin.
 *
 * Check order matches the app guard exactly: origin lock first (cheap, rejects obvious
 * cross-site abuse before spending a rate-limit slot), then the per-IP rate limit.
 * Forwarding via `fetch(request)` lets the platform route to the configured origin/
 * Pages project; this Worker only gates, it never rewrites the response.
 */
async function handleRequest(request: Request, env: EdgeSecurityEnv): Promise<Response> {
  const policy = resolveEdgePolicy(env);
  const tier = classifyRoutePath(new URL(request.url).pathname);
  const originLockEnabled = policy.originLock.enabled && tier !== 'webhook';

  if (originLockEnabled && !SAFE_METHODS.has(request.method.toUpperCase())) {
    const originHeader = request.headers.get('origin');
    if (!isOriginAllowed(originHeader, policy)) {
      return blocked('Request blocked: it came from a different site than your app.', 403);
    }
  }

  if (policy.rateLimit.enabled) {
    const clientId = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const result = checkRateLimit(clientId, tier, policy, Date.now());
    if (!result.allowed) {
      return blocked(
        'Too many requests in a short time. Please wait a moment and try again.',
        429,
        result.retryAfterSeconds,
      );
    }
  }

  return fetch(request);
}

/**
 * Worker entrypoint (ES-module format — the modern Workers shape `wrangler.toml`
 * points `main` at). `env` is passed in as a typed argument, so the policy reads its
 * `SECURITY_*` vars with no global lookups or casts. The whole file stays self-
 * contained: one default export, standard runtime globals, zero dependencies.
 */
const worker: ExportedWorker = {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};

export default worker;
