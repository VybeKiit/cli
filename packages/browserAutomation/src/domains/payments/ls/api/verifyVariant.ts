import type {
  LsSetupMode,
  LsSetupResult,
} from '@vybekiit/browser-automation/domains/payments/ls/types';

type VariantApiResponse = {
  readonly data?: {
    readonly attributes?: {
      readonly name?: string;
      readonly price?: number;
      readonly status?: string;
      readonly test_mode?: boolean;
    };
    readonly relationships?: {
      readonly product?: { readonly data?: { readonly id?: string } };
    };
  };
  readonly errors?: readonly { readonly detail?: string }[];
  readonly included?: readonly {
    readonly attributes?: { readonly name?: string };
    readonly id: string;
    readonly type: string;
  }[];
};

type ExpectedVariant = {
  readonly mode: LsSetupMode;
  readonly name: string;
  readonly priceCents: number;
};

/**
 * Read the first variant API error detail.
 *
 * @param body - Parsed variant API response body.
 * @param statusText - HTTP status text to use when the API sent no detail.
 * @returns Human-readable verify error detail.
 * @example
 * const detail = readVariantErrorDetail({ errors: [{ detail: 'Missing' }] }, 'Not Found');
 */
const readVariantErrorDetail = (body: VariantApiResponse, statusText: string): string => {
  const { errors } = body;
  if (errors === undefined) {
    return statusText;
  }

  const [firstError] = errors;
  if (firstError === undefined || firstError.detail === undefined) {
    return statusText;
  }

  return firstError.detail;
};

/**
 * Resolve a variant's display product name from included product data.
 *
 * @param body - Parsed variant API response body.
 * @param variantName - Variant name from the primary data payload.
 * @returns Product name when available, otherwise the variant name.
 * @example
 * const productName = resolveProductName(body, attrs.name);
 */
const resolveProductName = (
  body: VariantApiResponse,
  variantName: string | undefined,
): string | undefined => {
  const { included } = body;
  if (included !== undefined) {
    const product = included.find((record) => record.type === 'products');
    if (product !== undefined && product.attributes !== undefined) {
      const { name } = product.attributes;
      if (name !== undefined) {
        return name;
      }
    }
  }

  return variantName;
};

/**
 * Verify the variant exists and matches setup expectations via the Lemon Squeezy API.
 *
 * @param apiKey - Lemon Squeezy API key with store access.
 * @param variantId - Variant id to verify.
 * @param expected - Expected product name, price, and mode.
 * @returns Nothing when the variant matches.
 * @example
 * await verifyVariantViaApi(apiKey, '789', { name: 'Starter', priceCents: 2900, mode: 'test' });
 */
export const verifyVariantViaApi = async (
  apiKey: string,
  variantId: string,
  expected: ExpectedVariant,
): Promise<void> => {
  const headers = new Headers();
  headers.set('Accept', 'application/vnd.api+json');
  headers.set('Authorization', `Bearer ${apiKey}`);

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/variants/${variantId}?include=product`,
    { headers },
  );
  const body = (await response.json()) as VariantApiResponse;
  if (!response.ok) {
    const detail = readVariantErrorDetail(body, response.statusText);
    throw new Error(`Variant verify failed: ${detail}`);
  }

  const { data } = body;
  const attrs = data === undefined ? undefined : data.attributes;
  if (attrs === undefined) {
    throw new Error('Variant verify failed: empty response');
  }

  const wantTest = expected.mode === 'test';
  if (attrs.test_mode !== wantTest) {
    throw new Error(`Variant test_mode=${String(attrs.test_mode)} but setup mode=${expected.mode}`);
  }

  const productName = resolveProductName(body, attrs.name);
  if (productName !== undefined && !productName.includes(expected.name)) {
    throw new Error(`Variant product name "${productName}" does not match "${expected.name}"`);
  }

  if (attrs.price !== undefined && attrs.price !== expected.priceCents) {
    throw new Error(`Variant price ${attrs.price} cents != expected ${expected.priceCents} cents`);
  }

  if (attrs.status && attrs.status !== 'published' && attrs.status !== 'pending') {
    throw new Error(`Variant status is "${attrs.status}" - publish before checkout`);
  }
};

/**
 * Build environment variables from a completed Lemon Squeezy setup.
 *
 * @param result - Setup result returned by browser/API provisioning.
 * @param mode - Lemon Squeezy setup mode.
 * @returns Environment variable block for the buyer template.
 * @example
 * const env = lsSetupEnvBlock(result, 'test');
 */
export const lsSetupEnvBlock = (
  result: LsSetupResult,
  mode: LsSetupMode,
): Record<string, string> => {
  if (mode === 'test') {
    // Dual-key layout: keep live slots free for production; runtime prefers these when
    // LEMONSQUEEZY_TEST_MODE=true (see resolveLemonSqueezyEnv in @vybekiit/payments).
    return {
      LEMONSQUEEZY_TEST_MODE_API_KEY: result.apiKey,
      LEMONSQUEEZY_STORE_ID: result.storeId,
      LEMONSQUEEZY_TEST_MODE_STORE_PRODUCT_ID: result.variantId,
      LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET: result.webhookSecret,
      LEMONSQUEEZY_TEST_MODE: 'true',
      PAYMENTS_PROVIDER: 'lemon-squeezy',
    };
  }

  return {
    LEMONSQUEEZY_API_KEY: result.apiKey,
    LEMONSQUEEZY_STORE_ID: result.storeId,
    STORE_PRODUCT_ID: result.variantId,
    LEMONSQUEEZY_WEBHOOK_SECRET: result.webhookSecret,
    LEMONSQUEEZY_TEST_MODE: 'false',
    PAYMENTS_PROVIDER: 'lemon-squeezy',
  };
};
