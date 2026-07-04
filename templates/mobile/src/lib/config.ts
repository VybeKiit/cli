import { DEFAULT_APP_URL } from '@vybekiit/core';
import { readNodeEnv } from '@/lib/nodeEnv';

/**
 * Mobile app runtime config — the one place the base API URL is resolved.
 *
 * Unlike web (same-origin `fetch('/api/...')`), a native app has no implicit
 * origin, so every API call must be absolute. We read `EXPO_PUBLIC_APP_URL` (the
 * `EXPO_PUBLIC_` prefix is what Expo inlines into the JS bundle) and fall back to
 * the kit's shared `DEFAULT_APP_URL` for local dev. Centralized here so a backend
 * URL change is a one-line edit, not a scatter of raw strings (project standard).
 *
 * TODO(vybekiit): set EXPO_PUBLIC_APP_URL in `.env` to your deployed backend's address — skill: connect-account
 */
export const APP_URL: string = readNodeEnv().EXPO_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
