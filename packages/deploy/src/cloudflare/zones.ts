import type { CloudflareConfig } from '@vybekiit/core';

export interface CloudflareZone {
  readonly zoneId: string;
  readonly nameservers: string[];
  readonly status: string;
}

interface RawZone {
  id: string;
  status?: string;
  name_servers?: string[];
}

function toZone(raw: RawZone): CloudflareZone {
  return {
    zoneId: raw.id,
    nameservers: raw.name_servers ?? [],
    status: raw.status ?? 'pending',
  };
}

async function cloudflareFetch<T>(
  config: CloudflareConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = (await response.json()) as {
    success: boolean;
    result: T;
    errors?: { message: string }[];
  };
  if (!json.success) {
    const message = json.errors?.map((e) => e.message).join('; ') ?? response.statusText;
    throw new Error(message);
  }
  return json.result;
}

/** Find an existing zone by domain name, or create a full-setup zone. */
export async function getOrCreateZone(
  config: CloudflareConfig,
  domainName: string,
): Promise<CloudflareZone> {
  const normalised = domainName.toLowerCase().trim();
  const existing = await cloudflareFetch<RawZone[]>(
    config,
    `/zones?name=${encodeURIComponent(normalised)}`,
  );
  if (existing.length > 0) {
    return toZone(existing[0]!);
  }
  const created = await cloudflareFetch<RawZone>(config, '/zones', {
    method: 'POST',
    body: JSON.stringify({
      name: normalised,
      account: { id: config.CLOUDFLARE_ACCOUNT_ID },
      type: 'full',
    }),
  });
  return toZone(created);
}
