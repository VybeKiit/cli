/**
 * A tiny in-memory fixed-window rate limiter.
 *
 * Why in-memory (not Redis): the kit ships secure-by-default for a non-coder who has
 * configured no infrastructure, so the zero-dependency path must work the moment they
 * scaffold. A single Worker/serverless instance gets meaningful brute-force protection
 * from this; a buyer who later scales horizontally moves the same limits to the
 * Cloudflare edge (`infra/`), which reads the identical env toggles. The two layers are
 * complementary, not redundant — the edge caps distributed abuse, this caps per-instance.
 *
 * Fixed-window (count per `windowSeconds`, reset at the boundary) over a token bucket:
 * it's the simplest correct thing, and the bluntness is acceptable for an abuse guard.
 */

/** One client's counter within the current window. */
type WindowState = {
  count: number;
  /** Epoch ms when the current window ends and the count resets. */
  resetAt: number;
};

/** Outcome of a single {@link RateLimiter.check}. `allowed: false` carries the wait. */
export type RateLimitResult =
  | { readonly allowed: true; readonly remaining: number }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

/** A clock injected for deterministic tests; defaults to the real one. */
export type Clock = () => number;

/**
 * Per-key fixed-window limiter. Construct once and reuse across requests so counts
 * persist; constructing per request would reset everyone every time (no protection).
 */
export class RateLimiter {
  private readonly windows = new Map<string, WindowState>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly now: Clock;

  /**
   * Create a fixed-window limiter.
   *
   * @param max - Maximum hits allowed in one window.
   * @param windowSeconds - Window length in seconds.
   * @param now - Clock used to read the current epoch time.
   * @example
   * const limiter = new RateLimiter(10, 60);
   */
  constructor(max: number, windowSeconds: number, now: Clock = Date.now) {
    this.max = max;
    this.windowMs = windowSeconds * 1000;
    this.now = now;
  }

  /**
   * Record a hit for `key` and report whether it's within the limit.
   *
   * Lazily expires the window on read (no background timer): when the stored window has
   * elapsed, it starts a fresh one. Sweeps stale entries opportunistically so the Map
   * doesn't grow unbounded under churn of distinct keys.
   *
   * @param key - Caller bucket key, usually IP plus route tier.
   * @returns Whether the hit is allowed, with remaining count or retry delay.
   * @example
   * const verdict = limiter.check('1.2.3.4:auth-strict');
   */
  check(key: string): RateLimitResult {
    const now = this.now();
    const existing = this.windows.get(key);

    if (!existing || now >= existing.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      this.sweep(now);
      return { allowed: true, remaining: this.max - 1 };
    }

    if (existing.count >= this.max) {
      return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
    }

    existing.count += 1;
    return { allowed: true, remaining: this.max - existing.count };
  }

  /**
   * Drop windows that have already reset.
   *
   * @param now - Current epoch time in milliseconds.
   * @returns Nothing; stale windows are removed from the internal Map.
   * @example
   * this.sweep(Date.now());
   */
  private sweep(now: number): void {
    for (const [key, state] of this.windows) {
      if (now >= state.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}
