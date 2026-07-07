import type { RouteTier } from './routes';

/**
 * Shared shapes for `@vybekiit/security`.
 *
 * The package is deliberately framework-agnostic: a caller (the web `middleware.ts`,
 * a Worker, a test) describes an inbound request with {@link SecurityRequest}, and the
 * guard returns a {@link SecurityVerdict}. Nothing here imports Next, Express, or the
 * Cloudflare runtime — the same engine drives every enforcement point, so a rule can
 * never diverge between the app layer and the edge.
 */

/**
 * The minimal, framework-neutral view of an inbound request the guard needs.
 *
 * `method` and `originHeader` come straight off the request; `appOrigin` is the app's
 * own canonical origin (e.g. `https://myapp.com`) the request is checked against;
 * `clientId` is the stable per-caller key the rate limiter buckets on (the client IP
 * in practice). `originHeader` is intentionally `string | null` because browsers omit
 * `Origin` on same-origin GETs and top-level navigations.
 */
export type SecurityRequest = {
  readonly method: string;
  readonly originHeader: string | null;
  readonly appOrigin: string;
  readonly clientId: string;
  /** API path for tiered limits (e.g. `/api/auth/signin`). Optional for backward compat. */
  readonly path?: string;
};

/**
 * The guard's decision. `allowed: true` means let the request through. A block carries
 * a stable `reason` discriminant (callers map it to an HTTP status / plain-language
 * message) and, for rate-limit blocks, `retryAfterSeconds` for a `Retry-After` header.
 */
export type SecurityVerdict =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: 'origin' | 'rate-limit';
      readonly message: string;
      readonly retryAfterSeconds?: number;
    };

/**
 * The resolved, normalized security policy — the env SSOT turned into typed values the
 * engine acts on. Produced by {@link resolveSecurityPolicy} from the core
 * `securityConfigSchema`; `allowedOrigins` is the parsed CSV (already lowercased and
 * de-blanked), so the hot path never re-parses strings.
 */
export type SecurityPolicy = {
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly windowSeconds: number;
    readonly defaultMax: number;
    readonly tierMax: Readonly<Record<RouteTier, number>>;
  };
  readonly originLock: {
    readonly enabled: boolean;
    /** Extra origins allowed past the same-origin check, beyond the app's own origin. */
    readonly allowedOrigins: readonly string[];
  };
};
