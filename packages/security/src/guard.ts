import { classifyRoute, isOriginLockExempt } from './routes';
import { isOriginAllowed } from './origin';
import { isStateChanging, rateLimitMaxForTier, resolveSecurityPolicy } from './policy';
import { type Clock, RateLimiter } from './rate-limit';
import type { RouteTier } from './routes';
import type { SecurityPolicy, SecurityRequest, SecurityVerdict } from './types';

/**
 * The single enforcement engine the app middleware and tests both call.
 *
 * Construct once (it owns per-tier rate-limit state) and call
 * {@link SecurityGuard.evaluate} per request. Order of checks: origin lock first
 * (skipped for webhook tier), then the per-client, per-tier rate limit.
 */
export class SecurityGuard {
  private readonly policy: SecurityPolicy;
  private readonly limiters = new Map<RouteTier, RateLimiter>();
  private readonly now: Clock;

  constructor(policy: SecurityPolicy = resolveSecurityPolicy(), now: Clock = Date.now) {
    this.policy = policy;
    this.now = now;
  }

  private limiterFor(tier: RouteTier): RateLimiter | null {
    if (!this.policy.rateLimit.enabled) {
      return null;
    }
    let limiter = this.limiters.get(tier);
    if (!limiter) {
      limiter = new RateLimiter(
        rateLimitMaxForTier(this.policy, tier),
        this.policy.rateLimit.windowSeconds,
        this.now,
      );
      this.limiters.set(tier, limiter);
    }
    return limiter;
  }

  /** Run the configured checks against one request and return an allow/block verdict. */
  evaluate(request: SecurityRequest): SecurityVerdict {
    const tier = classifyRoute(request.path ?? '/api/unknown');
    const originLockEnabled = this.policy.originLock.enabled && !isOriginLockExempt(tier);

    if (
      originLockEnabled &&
      isStateChanging(request.method) &&
      !isOriginAllowed(request.originHeader, request.appOrigin, this.policy.originLock)
    ) {
      return {
        allowed: false,
        reason: 'origin',
        message: 'Request blocked: it came from a different site than your app.',
      };
    }

    const limiter = this.limiterFor(tier);
    if (limiter) {
      const bucketKey = `${request.clientId}:${tier}`;
      const result = limiter.check(bucketKey);
      if (!result.allowed) {
        return {
          allowed: false,
          reason: 'rate-limit',
          message: 'Too many requests in a short time. Please wait a moment and try again.',
          retryAfterSeconds: result.retryAfterSeconds,
        };
      }
    }

    return { allowed: true };
  }
}
