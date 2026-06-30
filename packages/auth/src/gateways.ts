import type { Result } from '@vybekiit/core';

/** Injectable SMS delivery seam for auth adapters — keeps env reads out of call paths in tests. */
export interface SmsGateway {
  sendOtp(phone: string): Promise<Result<true>>;
  verifyOtp(phone: string, code: string): Promise<Result<true>>;
}
