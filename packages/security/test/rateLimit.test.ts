import { describe, expect, it } from 'vitest';
import { RateLimiter } from '../src/rateLimit';

/** A controllable clock so window expiry is deterministic, not wall-clock dependent. */
function fakeClock(start = 0) {
  let now = start;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('RateLimiter', () => {
  it('allows up to max within a window, then blocks', () => {
    const clock = fakeClock();
    const limiter = new RateLimiter(3, 60, clock.now);

    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(true);

    const blocked = limiter.check('ip');
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('counts each key independently', () => {
    const clock = fakeClock();
    const limiter = new RateLimiter(1, 60, clock.now);

    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
    expect(limiter.check('b').allowed).toBe(true);
  });

  it('resets after the window elapses', () => {
    const clock = fakeClock();
    const limiter = new RateLimiter(1, 60, clock.now);

    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);

    clock.advance(60_000);
    expect(limiter.check('ip').allowed).toBe(true);
  });

  it('reports decreasing remaining within a window', () => {
    const limiter = new RateLimiter(2, 60, fakeClock().now);
    const first = limiter.check('ip');
    const second = limiter.check('ip');
    if (first.allowed) expect(first.remaining).toBe(1);
    if (second.allowed) expect(second.remaining).toBe(0);
  });
});
