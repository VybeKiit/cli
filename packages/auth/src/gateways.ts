import type { Effect } from 'effect';
import type { AuthError } from './types';

/** Injectable SMS delivery seam for auth adapters — keeps env reads out of call paths in tests. */
export type SmsGateway = {
  readonly sendOtp: (phone: string) => Effect.Effect<true, AuthError>;
  readonly verifyOtp: (phone: string, code: string) => Effect.Effect<true, AuthError>;
};
