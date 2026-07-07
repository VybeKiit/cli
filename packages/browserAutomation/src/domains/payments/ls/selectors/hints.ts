// biome-ignore-all lint/security/noSecrets: Field keys and regex hints are public selectors, not secrets.
// biome-ignore-all lint/style/noExcessiveLinesPerFile: Keeping the selector inventory together makes coverage audits traceable.

import { LS_DRAFT_FIELDS } from './fields';

/** Declarative matchers for LS passive probe classification. */
export type LsFieldHint = {
  readonly allowEmptyText?: boolean;
  readonly fieldKey: string;
  readonly fileInputIndex?: number;
  readonly inputType?: string;
  readonly labelPattern?: RegExp;
  readonly nearestHeadingPattern?: RegExp;
  readonly pathPattern?: RegExp;
  readonly placeholderPattern?: RegExp;
  readonly priority: number;
  readonly roles?: readonly string[];
  readonly tags?: readonly string[];
  readonly textPattern?: RegExp;
};

// `/products/123` -> match.
const PRODUCT_PATH = /\/products\/\d+/i;

export const LS_PRODUCT_FIELD_HINTS: readonly LsFieldHint[] = [
  {
    fieldKey: 'product.createButton',
    pathPattern: /\/products/i,
    tags: ['button', 'a'],
    roles: ['button', 'link'],
    textPattern: /new product|create product|add product/i,
    priority: 1,
  },
  {
    fieldKey: 'product.nameInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^name$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.descriptionInput',
    pathPattern: PRODUCT_PATH,
    tags: ['div', 'textarea'],
    roles: ['textbox'],
    nearestHeadingPattern: /description/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.single.option',
    pathPattern: PRODUCT_PATH,
    textPattern: /^single payment$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.subscription.option',
    pathPattern: PRODUCT_PATH,
    textPattern: /^subscription$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.leadMagnet.option',
    pathPattern: PRODUCT_PATH,
    textPattern: /^lead magnet$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.payWhatYouWant.option',
    pathPattern: PRODUCT_PATH,
    textPattern: /^pay what you want$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.priceInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^price$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.taxCategorySelect',
    pathPattern: PRODUCT_PATH,
    roles: ['combobox'],
    textPattern: /software as a service|tax category/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.pricingModelSelect',
    pathPattern: PRODUCT_PATH,
    roles: ['combobox'],
    textPattern: /standard pricing|pricing model/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.subscription.intervalSelect',
    pathPattern: PRODUCT_PATH,
    roles: ['combobox'],
    textPattern: /year|month|week|day|interval|every/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.payWhatYouWant.minPriceInput',
    pathPattern: PRODUCT_PATH,
    labelPattern: /minimum price|min price/i,
    priority: 1,
  },
  {
    fieldKey: 'product.pricing.payWhatYouWant.suggestedPriceInput',
    pathPattern: PRODUCT_PATH,
    labelPattern: /suggested price/i,
    priority: 1,
  },
  {
    fieldKey: 'product.media.uploadInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    inputType: 'file',
    fileInputIndex: 0,
    priority: 1,
  },
  {
    fieldKey: 'product.files.uploadInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    inputType: 'file',
    fileInputIndex: 1,
    priority: 1,
  },
  {
    fieldKey: 'product.variants.addButton',
    pathPattern: PRODUCT_PATH,
    tags: ['button'],
    textPattern: /add variant/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.saveDraftButton',
    pathPattern: PRODUCT_PATH,
    tags: ['button'],
    textPattern: /save as draft/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.publishButton',
    pathPattern: PRODUCT_PATH,
    tags: ['button'],
    textPattern: /publish product|^publish$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.menuTrigger',
    pathPattern: PRODUCT_PATH,
    tags: ['button'],
    priority: 1,
  },
  {
    fieldKey: 'product.actions.editMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^edit$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.shareMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^share$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.previewMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^preview$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.unpublishMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^unpublish$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.duplicateMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^duplicate$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.copyToTestModeMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /copy to test mode/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.copyIdMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^copy id$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.actions.deleteMenuItem',
    pathPattern: PRODUCT_PATH,
    tags: ['a'],
    textPattern: /^delete$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.settings.licenseKeysToggle',
    pathPattern: PRODUCT_PATH,
    roles: ['checkbox'],
    labelPattern: /generate license keys/i,
    priority: 1,
  },
  {
    fieldKey: 'product.settings.storefrontDisplayToggle',
    pathPattern: PRODUCT_PATH,
    roles: ['checkbox'],
    labelPattern: /display product on storefront/i,
    priority: 1,
  },
  {
    fieldKey: 'product.settings.confirmationModalToggle',
    pathPattern: PRODUCT_PATH,
    textPattern: /^confirmation modal$/i,
    tags: ['a', 'button'],
    priority: 1,
  },
  {
    fieldKey: 'product.settings.emailReceiptToggle',
    pathPattern: PRODUCT_PATH,
    textPattern: /^email receipt$/i,
    tags: ['a', 'button'],
    priority: 1,
  },
  {
    fieldKey: 'product.confirmation.titleInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^title$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.confirmation.messageInput',
    pathPattern: PRODUCT_PATH,
    tags: ['div'],
    roles: ['textbox'],
    nearestHeadingPattern: /confirmation modal/i,
    priority: 1,
  },
  {
    fieldKey: 'product.confirmation.buttonTextInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^button text$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.confirmation.buttonLinkInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^button link$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.emailReceipt.thankYouNoteInput',
    pathPattern: PRODUCT_PATH,
    tags: ['textarea', 'input'],
    labelPattern: /^thank you note$/i,
    priority: 1,
  },
  {
    fieldKey: 'product.emailReceipt.buttonTextInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^button text$/i,
    nearestHeadingPattern: /email receipt/i,
    priority: 1,
  },
  {
    fieldKey: 'product.emailReceipt.buttonLinkInput',
    pathPattern: PRODUCT_PATH,
    tags: ['input'],
    labelPattern: /^button link$/i,
    nearestHeadingPattern: /email receipt/i,
    priority: 1,
  },
];

export const LS_LEGACY_API_FIELD_HINTS: readonly LsFieldHint[] = [
  {
    fieldKey: 'apiKey.createButton',
    pathPattern: /\/settings\/api/i,
    tags: ['button'],
    textPattern: /create api|new api|add api/i,
    priority: 1,
  },
  {
    fieldKey: 'apiKey.nameInput',
    pathPattern: /\/settings\/api/i,
    tags: ['input'],
    placeholderPattern: /api key name/i,
    priority: 1,
  },
  {
    fieldKey: 'webhook.urlInput',
    pathPattern: /\/webhooks?|\/settings\/webhooks?/i,
    tags: ['input'],
    labelPattern: /callback url/i,
    priority: 1,
  },
  {
    fieldKey: 'webhook.saveButton',
    pathPattern: /\/webhooks?|\/settings\/webhooks?/i,
    tags: ['button'],
    textPattern: /save webhook/i,
    priority: 1,
  },
];

export const LS_FIELD_HINTS: readonly LsFieldHint[] = [
  ...LS_PRODUCT_FIELD_HINTS,
  ...LS_LEGACY_API_FIELD_HINTS,
];

/**
 * Verify every product draft field has a passive probe hint.
 *
 * @returns Nothing when all product fields are covered.
 * @example
 * assertHintsCoverDraftFields();
 */
export const assertHintsCoverDraftFields = (): void => {
  const hinted = new Set(LS_PRODUCT_FIELD_HINTS.map((h) => h.fieldKey));
  for (const key of LS_DRAFT_FIELDS) {
    if (!(key.startsWith('dashboard.') || hinted.has(key))) {
      throw new Error(`Missing probe hint for ${key}`);
    }
  }
};

assertHintsCoverDraftFields();
