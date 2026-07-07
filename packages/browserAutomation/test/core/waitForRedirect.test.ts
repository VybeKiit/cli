import { waitForRedirectAfterSignIn } from '@vybekiit/browser-automation/core/waitForRedirect';
import { describe, expect, it, vi } from 'vitest';

describe('waitForRedirectAfterSignIn', () => {
  it('returns immediately when a tab is already authenticated', async () => {
    const page = {
      url: () => 'https://developer.godaddy.com/keys',
      isClosed: () => false,
      context: () => context,
      bringToFront: vi.fn(),
      waitForURL: vi.fn(),
      waitForTimeout: vi.fn(),
    };
    const context = {
      pages: () => [page],
    };

    const result = await waitForRedirectAfterSignIn(
      page as never,
      context as never,
      {
        isAuthenticated: (url) => url.includes('developer.godaddy.com'),
        logPrefix: '[gd]',
        prompt: 'sign in',
      },
      console,
    );

    expect(result).toBe(page);
    expect(page.waitForURL).not.toHaveBeenCalled();
  });

  it('switches to another tab when sign-in completes there', async () => {
    const waitingPage = {
      url: () => 'https://sso.godaddy.com/login',
      isClosed: () => false,
      context: () => context,
      bringToFront: vi.fn(),
      waitForURL: vi.fn().mockRejectedValue(new Error('timeout')),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    };
    const readyPage = {
      url: () => 'https://developer.godaddy.com/keys',
      isClosed: () => false,
      bringToFront: vi.fn(),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    };
    const context = {
      pages: () => [waitingPage, readyPage],
    };

    const result = await waitForRedirectAfterSignIn(
      waitingPage as never,
      context as never,
      {
        isAuthenticated: (url) => url.includes('developer.godaddy.com'),
        logPrefix: '[gd]',
        prompt: 'sign in',
        timeoutEnvVar: 'TEST_AUTH_TIMEOUT_MS',
      },
      console,
    );

    expect(result).toBe(readyPage);
    expect(readyPage.bringToFront).toHaveBeenCalled();
  });
});
