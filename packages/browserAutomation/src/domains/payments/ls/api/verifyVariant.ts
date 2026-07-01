import type { LsSetupMode, LsSetupResult } from '../types';

type VariantApiResponse = {
  data?: {
    attributes?: {
      name?: string;
      price?: number;
      status?: string;
      test_mode?: boolean;
    };
    relationships?: {
      product?: { data?: { id?: string } };
    };
  };
  included?: { type: string; id: string; attributes?: { name?: string } }[];
};

/** Verify the variant exists and matches setup expectations via LS REST API. */
export async function verifyVariantViaApi(
  apiKey: string,
  variantId: string,
  expected: { name: string; priceCents: number; mode: LsSetupMode },
): Promise<void> {
  const res = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}?include=product`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const body = (await res.json()) as VariantApiResponse;
  if (!res.ok) {
    const detail =
      (body as { errors?: { detail?: string }[] }).errors?.[0]?.detail ?? res.statusText;
    throw new Error(`Variant verify failed: ${detail}`);
  }

  const attrs = body.data?.attributes;
  if (!attrs) throw new Error('Variant verify failed: empty response');

  const wantTest = expected.mode === 'test';
  if (attrs.test_mode !== wantTest) {
    throw new Error(`Variant test_mode=${String(attrs.test_mode)} but setup mode=${expected.mode}`);
  }

  const productName =
    body.included?.find((r) => r.type === 'products')?.attributes?.name ?? attrs.name;
  if (productName && !productName.includes(expected.name)) {
    throw new Error(`Variant product name "${productName}" does not match "${expected.name}"`);
  }

  if (attrs.price !== undefined && attrs.price !== expected.priceCents) {
    throw new Error(`Variant price ${attrs.price} cents != expected ${expected.priceCents} cents`);
  }

  if (attrs.status && attrs.status !== 'published' && attrs.status !== 'pending') {
    throw new Error(`Variant status is "${attrs.status}" — publish before checkout`);
  }
}

export function lsSetupEnvBlock(result: LsSetupResult, mode: LsSetupMode): Record<string, string> {
  return {
    LEMONSQUEEZY_API_KEY: result.apiKey,
    LEMONSQUEEZY_STORE_ID: result.storeId,
    STORE_PRODUCT_ID: result.variantId,
    LEMONSQUEEZY_WEBHOOK_SECRET: result.webhookSecret,
    LEMONSQUEEZY_TEST_MODE: mode === 'test' ? 'true' : 'false',
    PAYMENTS_PROVIDER: 'lemon-squeezy',
  };
}
