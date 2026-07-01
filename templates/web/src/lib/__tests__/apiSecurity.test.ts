import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { SecurityGuard } from '@vybekiit/security';
import { evaluateApiSecurity } from '@/lib/apiSecurity';

describe('evaluateApiSecurity', () => {
  it('allows same-origin state-changing API requests', () => {
    const request = new NextRequest('https://myapp.com/api/checkout', {
      method: 'POST',
      headers: { origin: 'https://myapp.com' },
    });
    expect(evaluateApiSecurity(request)).toBeNull();
  });

  it('blocks cross-origin POST to protected API routes', () => {
    const request = new NextRequest('https://myapp.com/api/checkout', {
      method: 'POST',
      headers: { origin: 'https://evil.com' },
    });
    const blocked = evaluateApiSecurity(request);
    expect(blocked?.status).toBe(403);
  });

  it('skips non-api paths', () => {
    const request = new NextRequest('https://myapp.com/en/dashboard', {
      method: 'GET',
      headers: { origin: 'https://evil.com' },
    });
    expect(evaluateApiSecurity(request)).toBeNull();
  });
});

describe('SecurityGuard integration', () => {
  it('exempts webhook tier from origin lock', () => {
    const guard = new SecurityGuard();
    const verdict = guard.evaluate({
      method: 'POST',
      originHeader: 'https://payments.example',
      appOrigin: 'https://myapp.com',
      clientId: '1.2.3.4',
      path: '/api/webhook',
    });
    expect(verdict.allowed).toBe(true);
  });
});
