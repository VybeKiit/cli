import { Effect } from 'effect';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendTwilioSmsOtp, verifyTwilioSmsOtp } from './twilio';

const config = {
  TWILIO_ACCOUNT_SID: 'ACtest',
  TWILIO_AUTH_TOKEN: 'secret',
  TWILIO_FROM_NUMBER: '+15550001111',
};

describe('Twilio SMS helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a practice code without a sender', async () => {
    const result = await Effect.runPromise(
      sendTwilioSmsOtp('+15551234567', {
        ...config,
        TWILIO_FROM_NUMBER: '',
      }),
    );

    expect(result).toBe(true);
  });

  it('verifyTwilioSmsOtp accepts practice code 000000', async () => {
    const result = await Effect.runPromise(
      verifyTwilioSmsOtp('+15551234567', '000000', {
        ...config,
        TWILIO_FROM_NUMBER: '',
      }),
    );

    expect(result).toBe(true);
  });

  it('verifyTwilioSmsOtp rejects wrong code', async () => {
    const error = await Effect.runPromise(
      Effect.flip(
        verifyTwilioSmsOtp('+15551234567', '123456', {
          ...config,
          TWILIO_FROM_NUMBER: '',
        }),
      ),
    );

    expect(error.code).toBe('NOTIFICATIONS_VERIFY_FAILED');
  });

  it('uses Verify API when service sid is set', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: 'approved' }) });
    vi.stubGlobal('fetch', fetchMock);
    const withVerify = { ...config, TWILIO_VERIFY_SERVICE_SID: 'VATEST' };
    await Effect.runPromise(sendTwilioSmsOtp('+15551234567', withVerify));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/Verifications'),
      expect.any(Object),
    );
    const verify = await Effect.runPromise(
      verifyTwilioSmsOtp('+15551234567', '123456', withVerify),
    );

    expect(verify).toBe(true);
  });
});
