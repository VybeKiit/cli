/** Prefix for maintainer E2E probe artifacts — grep/delete by this string. */
export const LS_E2E_PREFIX = 'vybekiit-probe';

export type LsPricingProbeType = 'single' | 'subscription' | 'leadMagnet' | 'payWhatYouWant';

export type LsE2eArtifacts = {
  deletedProductNames: string[];
  productIds: string[];
  productNames: string[];
  productUrls: string[];
  runId: string;
  variantId?: string;
};

export function createE2eArtifacts(): LsE2eArtifacts {
  const runId = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return {
    runId,
    productNames: [],
    productUrls: [],
    productIds: [],
    deletedProductNames: [],
  };
}

export function probeProductName(type: LsPricingProbeType, runId: string): string {
  const slug =
    type === 'payWhatYouWant' ? 'pwyw' : type === 'leadMagnet' ? 'lead' : type;
  return `${LS_E2E_PREFIX}-${slug}-${runId}`;
}

export function matchesE2ePrefix(name: string): boolean {
  return name.includes(LS_E2E_PREFIX);
}
