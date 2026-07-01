import type { AuthHttpDeps } from '@vybekiit/auth/http';
import { clearSessionCookie, readSessionCookie, setSessionCookie } from '@/lib/auth-session';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '@/lib/auth-telemetry';

/** Shared deps for {@link createNextAuthRoutes} — wires Next session cookies + telemetry. */
export const webAuthHttpDeps: AuthHttpDeps = {
  session: {
    setSession: setSessionCookie,
    readSession: readSessionCookie,
    clearSession: clearSessionCookie,
  },
  telemetry: {
    trackAuthEvent,
    captureAuthRejection,
    captureAuthFailure,
  },
};
