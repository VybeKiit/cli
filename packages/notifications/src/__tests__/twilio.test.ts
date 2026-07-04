import { sendTwilioSmsOtp, verifyTwilioSmsOtp } from '@vybekiit/notifications/providers/twilio';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = {
  TWILIO_ACCOUNT_SID: 'ACtest',
  TWILIO_AUTH_TOKEN: 'secret',
  TWILIO_FROM_NUMBER: '+15550001111',
};

describe('Twilio SMS helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sendTwilioSmsOtp succeeds without FROM when no verify service (practice)', async () => {
    const result = await sendTwilioSmsOtp('+15551234567', {
      ...config,
      TWILIO_FROM_NUMBER: '',
    });
    expect(result.ok && result.value).toBe(true);
  });

  it('verifyTwilioSmsOtp accepts practice code 000000', async () => {
    const result = await verifyTwilioSmsOtp('+15551234567', '000000', {
      ...config,
      TWILIO_FROM_NUMBER: '',
    });
    expect(result.ok && result.value).toBe(true);
  });

  it('verifyTwilioSmsOtp rejects wrong code', async () => {
    const result = await verifyTwilioSmsOtp('+15551234567', '123456', {
      ...config,
      TWILIO_FROM_NUMBER: '',
    });
    expect(result.ok).toBe(false);
  });

  it('uses Verify API when service sid is set', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: 'approved' }) });
    vi.stubGlobal('fetch', fetchMock);
    const withVerify = { ...config, TWILIO_VERIFY_SERVICE_SID: 'VATEST' };
    await sendTwilioSmsOtp('+15551234567', withVerify);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/Verifications'),
      expect.any(Object),
    );
    const verify = await verifyTwilioSmsOtp('+15551234567', '123456', withVerify);
    expect(verify.ok && verify.value).toBe(true);
  });
});
