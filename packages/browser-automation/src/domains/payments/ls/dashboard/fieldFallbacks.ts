import type { Page } from 'playwright';

import type { LsDraftFieldKey } from '../selectors/fields';

export type LsFieldFallback = {
  /** Scope clicks/lookups under a section heading when set. */
  sectionHeading?: string;
  role?: { role: Parameters<Page['getByRole']>[0]; name: RegExp | string; exact?: boolean };
  text?: { text: RegExp | string; exact?: boolean };
  label?: RegExp | string;
  placeholder?: RegExp | string;
  css?: string;
  fileInputIndex?: number;
};

/** Runtime text/role hints when registry entry is missing or not visible. */
export const LS_FIELD_FALLBACKS: Partial<Record<LsDraftFieldKey, LsFieldFallback>> = {
  'product.createButton': { role: { role: 'button', name: /new product/i } },
  'product.nameInput': { css: '#input_name' },
  'product.descriptionInput': { css: '[contenteditable="true"]' },
  'product.pricing.single.option': {
    sectionHeading: 'Pricing',
    text: { text: 'Single payment', exact: true },
  },
  'product.pricing.subscription.option': {
    sectionHeading: 'Pricing',
    text: { text: 'Subscription', exact: true },
  },
  'product.pricing.leadMagnet.option': {
    sectionHeading: 'Pricing',
    text: { text: 'Lead magnet', exact: true },
  },
  'product.pricing.payWhatYouWant.option': {
    sectionHeading: 'Pricing',
    text: { text: 'Pay what you want', exact: true },
  },
  'product.pricing.priceInput': { css: '#input_price' },
  'product.pricing.taxCategorySelect': { css: '#vs2__combobox' },
  'product.pricing.pricingModelSelect': { css: '#vs1__combobox' },
  'product.pricing.subscription.intervalSelect': { css: '#vs3__combobox' },
  'product.pricing.payWhatYouWant.minPriceInput': { css: '#input_min_price' },
  'product.pricing.payWhatYouWant.suggestedPriceInput': { css: '#input_suggested_price' },
  'product.media.uploadInput': { fileInputIndex: 0 },
  'product.files.uploadInput': { fileInputIndex: 1 },
  'product.variants.addButton': { role: { role: 'button', name: /add variant/i } },
  'product.actions.saveDraftButton': { role: { role: 'button', name: /save as draft/i } },
  'product.actions.publishButton': { role: { role: 'button', name: /publish product/i } },
  'product.actions.menuTrigger': { css: '[dusk="actions-menu-trigger"]' },
  'product.actions.editMenuItem': { css: '[dusk="action-edit"]' },
  'product.actions.shareMenuItem': { css: '[dusk="action-share"]' },
  'product.actions.previewMenuItem': { css: '[dusk="action-preview"]' },
  'product.actions.unpublishMenuItem': { css: '[dusk="action-unpublish"]' },
  'product.actions.duplicateMenuItem': { css: '[dusk="action-duplicate"]' },
  'product.actions.copyToTestModeMenuItem': { css: '[dusk="action-copy"]' },
  'product.actions.copyIdMenuItem': { css: '[dusk="action-copyId"]' },
  'product.actions.deleteMenuItem': { css: '[dusk="action-delete"]' },
  'product.settings.licenseKeysToggle': {
    role: { role: 'checkbox', name: /generate license keys/i },
  },
  'product.settings.storefrontDisplayToggle': {
    role: { role: 'checkbox', name: /display product on storefront/i },
  },
  'product.settings.confirmationModalToggle': { text: { text: 'Confirmation modal', exact: true } },
  'product.settings.emailReceiptToggle': { text: { text: 'Email receipt', exact: true } },
  'product.confirmation.titleInput': { css: '#confirmation_title' },
  'product.confirmation.messageInput': { css: '#confirmation_title ~ [contenteditable="true"]' },
  'product.confirmation.buttonTextInput': { css: '#confirmation_button_text' },
  'product.confirmation.buttonLinkInput': { css: '#redirect_url' },
  'product.emailReceipt.thankYouNoteInput': { css: '#thank_you_note' },
  'product.emailReceipt.buttonTextInput': { css: '#button_text' },
  'product.emailReceipt.buttonLinkInput': { css: '#button_link' },
};

export function scopeForFallback(page: Page, fallback: LsFieldFallback) {
  if (!fallback.sectionHeading) return page;
  const heading = page
    .getByRole('heading', { name: new RegExp(fallback.sectionHeading, 'i') })
    .first();
  return heading.locator('xpath=ancestor::*[self::section or self::div][1]').first();
}

export function locatorFromFallback(page: Page, fallback: LsFieldFallback) {
  const root = scopeForFallback(page, fallback);

  if (fallback.fileInputIndex !== undefined) {
    return root.locator('input[type="file"]').nth(fallback.fileInputIndex);
  }
  if (fallback.css) return root.locator(fallback.css).first();
  if (fallback.role) {
    const roleOpts: { name: string | RegExp; exact?: boolean } = { name: fallback.role.name };
    if (fallback.role.exact !== undefined) roleOpts.exact = fallback.role.exact;
    return root.getByRole(fallback.role.role, roleOpts);
  }
  if (fallback.text) {
    return root.getByText(fallback.text.text, { exact: fallback.text.exact ?? false });
  }
  if (fallback.label) return root.getByLabel(fallback.label);
  if (fallback.placeholder) return root.getByPlaceholder(fallback.placeholder);

  throw new Error('Empty field fallback definition');
}
