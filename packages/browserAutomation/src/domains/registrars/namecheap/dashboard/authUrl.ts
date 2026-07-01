/** App routes that require a signed-in Namecheap session. */
export const NC_AUTHENTICATED_URL =
  /(?:^ap\.www\.namecheap\.com(?:\/|$)|^www\.namecheap\.com\/(?:dashboard|Profile)(?:\/|$))/i;

export const NC_AUTH_URL_HINT =
  /(login|sign-?in|sign-?up|register|oauth|auth|session\/new|Identity\/Account)/i;

/** Host + path only — avoids false positives from `ReturnUrl=` query params on login pages. */
function ncHostPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('namecheap.com')) return null;
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export function isNcAuthenticatedUrl(url: string): boolean {
  const hostPath = ncHostPath(url);
  if (!hostPath) return false;
  if (NC_AUTH_URL_HINT.test(hostPath)) return false;
  if (/^ap\.www\.namecheap\.com/i.test(hostPath)) return true;
  if (/^www\.namecheap\.com\/myaccount(?:\/|$)/i.test(hostPath)) {
    return !/\/myaccount\/(?:login|sign)/i.test(hostPath);
  }
  return NC_AUTHENTICATED_URL.test(hostPath);
}
