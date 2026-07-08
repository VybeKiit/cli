import { CLOUDFLARE_API_BASE } from '@vybekiit/browser-automation/core/constants';

/**
 * Live verification of a freshly minted Cloudflare token via the account tokens/verify
 * endpoint. Confirms the token is `active` before we consider setup successful. The token
 * value stays inside this module — only a boolean is returned to the caller.
 */
export type CfVerifyResult = {
  readonly ok: boolean;
  readonly status?: string;
};

/**
 * Verify Cf Token.
 *
 * @param accountId - Cloudflare account id used for verification.
 * @param token - Token value to verify.
 * @returns Promise resolving with the verification result.
 * @example
 * const result = await verifyCfToken('example-account', 'test-token');
 */
export const verifyCfToken = async (accountId: string, token: string): Promise<CfVerifyResult> => {
  const url = accountId
    ? `${CLOUDFLARE_API_BASE}/accounts/${accountId}/tokens/verify`
    : `${CLOUDFLARE_API_BASE}/user/tokens/verify`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      result?: { status?: string };
    };
    const status = body.result?.status;
    return { ok: Boolean(body.success) && status === 'active', ...(status ? { status } : {}) };
  } catch {
    return { ok: false };
  }
};
