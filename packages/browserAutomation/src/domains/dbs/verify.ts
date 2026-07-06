/**
 * Live verification of a Supabase anon key against the project's REST endpoint. A reachable
 * PostgREST root with the key attached (anything but 401/403) confirms the URL + key pair.
 * The key stays in this module; only a boolean surfaces to the caller.
 */
export interface SupabaseVerifyResult {
  readonly ok: boolean;
  readonly httpStatus?: number;
}

export async function verifySupabaseKeys(
  projectUrl: string,
  anonKey: string,
): Promise<SupabaseVerifyResult> {
  try {
    const res = await fetch(`${projectUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    // 200/404 = reachable & authorized (no such table is fine); 401/403 = bad key.
    const ok = res.status !== 401 && res.status !== 403;
    return { ok, httpStatus: res.status };
  } catch {
    return { ok: false };
  }
}
