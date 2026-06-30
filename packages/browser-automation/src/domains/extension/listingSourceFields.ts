import type { Page } from 'playwright';

import type { CwsListing } from './schema';

import { fieldLocator } from './locator';
import { safeClick } from './safeClick';

/**
 * Asset slots that a verb cannot push without a real file path on disk and
 * dev-console drag-and-drop support. The writer fails closed on these.
 */
const FILE_UPLOAD_FIELDS = new Set([
  'listing.icon',
  'listing.promoTileMarquee',
  'listing.promoTileSmall',
  'listing.screenshots',
]);

/**
 * Map combobox-backed listing field paths to the dev-console label that
 * `aria-labelledby` resolves to.
 */
const LISTING_COMBOBOX_LABELS: Record<string, string> = {
  'listing.category': 'Category',
  'listing.language': 'Language',
  'listing.officialUrl': 'Official URL',
};

/**
 * The three "I do not ..." certification checkboxes near the bottom of the
 * privacy tab. Matched by prefix on `aria-label` so schema names stay readable.
 */
const CERTIFICATION_LABEL_PREFIXES: Record<keyof CwsListing['privacy']['certifications'], string> =
  {
    noCreditworthiness: 'I do not use or transfer user data to determine creditworthiness',
    noDataSale: 'I do not sell or transfer user data to third parties',
    noUnrelatedUse: 'I do not use or transfer user data for purposes that are unrelated',
  };

/**
 * The data-use disclosure object with its optionality stripped — the concrete
 * nine-boolean shape the dev-console checkboxes map onto. Derived with
 * `NonNullable` so the key set survives `exactOptionalPropertyTypes` (a bare
 * `Required<…>[…]` index leaves the `| undefined` in place under that flag).
 */
type DataUseDisclosure = NonNullable<CwsListing['privacy']['dataUseDisclosure']>;

/**
 * The dev console's "Data usage" section is a fixed list of nine checkboxes,
 * each labelled by the data type it represents.
 */
const DATA_USE_LABELS: Record<keyof DataUseDisclosure, string> = {
  collectsActivity: 'User activity',
  collectsAuth: 'Authentication information',
  collectsFinancial: 'Financial and payment information',
  collectsHealth: 'Health information',
  collectsLocation: 'Location',
  collectsPersonalCommunications: 'Personal communications',
  collectsPii: 'Personally identifiable information',
  collectsWebHistory: 'Web history',
  collectsWebsiteContent: 'Website content',
};

/**
 * Applies certifications changes from the local model into the Chrome Web Store automation form.
 */
export async function applyCertifications(
  page: Page,
  before: unknown,
  after: unknown,
): Promise<void> {
  const beforeMap = (before ?? {}) as Record<string, boolean>;
  const afterMap = (after ?? {}) as Record<string, boolean>;

  for (const [field, prefix] of Object.entries(CERTIFICATION_LABEL_PREFIXES)) {
    const desired = Boolean(afterMap[field]);
    const current = Boolean(beforeMap[field]);
    if (desired === current) continue;

    const id = (await page.evaluate(
      `(() => {
        const wanted = ${JSON.stringify(prefix.toLowerCase())};
        for (const cb of Array.from(document.querySelectorAll('input[type="checkbox"][aria-label]'))) {
          const label = (cb.getAttribute('aria-label') || '').toLowerCase();
          if (label.startsWith(wanted)) {
            if (!cb.id) cb.id = 'cws-cert-' + Math.random().toString(36).slice(2, 10);
            return cb.id;
          }
        }
        return null;
      })()`,
    )) as null | string;
    if (!id) {
      throw new Error(
        `Certification checkbox starting with "${prefix}" not found on the privacy tab.`,
      );
    }
    const checkbox = page.locator(`#${id}`);
    if (desired) await checkbox.check();
    else await checkbox.uncheck();
  }
}

/**
 * Applies data use disclosure changes from the local model into the Chrome Web Store automation form.
 */
export async function applyDataUseDisclosure(
  page: Page,
  before: unknown,
  after: unknown,
): Promise<void> {
  const beforeMap = (before ?? {}) as Record<string, boolean>;
  const afterMap = (after ?? {}) as Record<string, boolean>;

  for (const [field, label] of Object.entries(DATA_USE_LABELS)) {
    const desired = Boolean(afterMap[field]);
    const current = Boolean(beforeMap[field]);
    if (desired === current) continue;
    const checkbox = page.locator(`input[type="checkbox"][aria-label="${label}"]`).first();
    if (desired) await checkbox.check();
    else await checkbox.uncheck();
  }
}

/**
 * Applies permissions justification changes from the local model into the Chrome Web Store automation form.
 */
export async function applyPermissionsJustification(
  page: Page,
  before: unknown,
  after: unknown,
): Promise<void> {
  const beforeMap = (before ?? {}) as Record<string, string>;
  const afterMap = (after ?? {}) as Record<string, string>;

  for (const [permission, value] of Object.entries(afterMap)) {
    if (beforeMap[permission] === value) continue;
    await fillTextareaByLabelPrefix(page, `${permission} justification`, value);
  }
  for (const permission of Object.keys(beforeMap)) {
    if (permission in afterMap) continue;
    await fillTextareaByLabelPrefix(page, `${permission} justification`, '');
  }
}

/**
 * Applies regions changes from the local model into the Chrome Web Store automation form.
 */
export async function applyRegions(page: Page, before: unknown, after: unknown): Promise<void> {
  const beforeMap = (before ?? {}) as Record<string, boolean>;
  const afterMap = (after ?? {}) as Record<string, boolean>;

  await page
    .getByRole('button', { name: 'Show more' })
    .first()
    .click({ timeout: 1500 })
    .catch(() => undefined);

  const idByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const li of Array.from(document.querySelectorAll('li'))) {
      const cb = li.querySelector('input[type="checkbox"]');
      if (!cb) continue;
      const text = (li.textContent || '').trim().replace(/\\s+/g, ' ');
      if (!text) continue;
      if (!li.id) li.id = 'cws-region-li-' + Math.random().toString(36).slice(2, 10);
      out[text] = li.id;
    }
    return out;
  })()`)) as Record<string, string>;

  for (const [label, desired] of Object.entries(afterMap)) {
    if (Boolean(beforeMap[label]) === Boolean(desired)) continue;
    const id = idByLabel[label];
    if (!id) {
      throw new Error(
        `Region "${label}" not found on the distribution page. The dev console may have renamed or removed it; re-run \`pnpm cws import-listing\` to refresh.`,
      );
    }
    const li = page.locator(`#${id}`);
    const isChecked = await li
      .locator('input[type="checkbox"]')
      .first()
      .isChecked()
      .catch(() => false);
    if (isChecked !== Boolean(desired)) {
      await li.click();
    }
  }
}

/**
 * Maintains fill textarea by label prefix behavior at the Chrome Web Store automation module boundary.
 */
export async function fillTextareaByLabelPrefix(
  page: Page,
  prefix: string,
  value: string,
): Promise<void> {
  const id = (await page.evaluate(
    `(() => {
      const prefixLower = ${JSON.stringify(prefix.toLowerCase())};
      for (const ta of Array.from(document.querySelectorAll('textarea'))) {
        const labelledById = ta.getAttribute('aria-labelledby');
        let label = '';
        if (labelledById) {
          const ref = document.getElementById(labelledById);
          if (ref) label = (ref.textContent || '').trim();
        }
        if (!label) {
          const wrap = ta.closest('label');
          if (wrap) label = (wrap.textContent || '').trim();
        }
        if (!label.toLowerCase().startsWith(prefixLower)) continue;
        if (!ta.id) ta.id = 'cws-fill-' + Math.random().toString(36).slice(2, 10);
        return ta.id;
      }
      return null;
    })()`,
  )) as null | string;

  if (!id) {
    throw new Error(
      `Could not find textarea labelled "${prefix}". The dev console may have renamed the field, or the permission is not declared on this listing.`,
    );
  }
  await page.locator(`#${id}`).fill(value);
}

/**
 * Guards is file upload field decisions where Chrome Web Store automation callers need a stable boolean rule.
 */
export function isFileUploadField(field: string): boolean {
  return FILE_UPLOAD_FIELDS.has(field);
}

/**
 * Reads asset slots into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readAssetSlots(page: Page): Promise<{
  icon: string | undefined;
  promoTileMarquee: string | undefined;
  promoTileSmall: string | undefined;
  screenshots: string[];
}> {
  const labels = (await page.evaluate(`(() => {
    const out = [];
    for (const el of Array.from(document.querySelectorAll('[role="button"][aria-label]'))) {
      const label = el.getAttribute('aria-label') || '';
      const match = label.match(/^Remove image\\s+(.+?)\\s*$/);
      if (match) out.push(match[1]);
    }
    return out;
  })()`)) as string[];

  const screenshots = labels
    .filter((label) => /^Screenshot\s+\d+$/i.test(label))
    .sort((a, b) => screenshotIndex(a) - screenshotIndex(b));
  return {
    icon: labels.includes('Store icon') ? 'Store icon' : undefined,
    promoTileMarquee: labels.includes('Marquee promo tile') ? 'Marquee promo tile' : undefined,
    promoTileSmall: labels.includes('Small promo tile') ? 'Small promo tile' : undefined,
    screenshots,
  };
}

/**
 * Reads certifications into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readCertifications(
  page: Page,
): Promise<CwsListing['privacy']['certifications']> {
  const checkedByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const el of Array.from(document.querySelectorAll('input[type="checkbox"][aria-label]'))) {
      out[el.getAttribute('aria-label') || ''] = !!el.checked;
    }
    return out;
  })()`)) as Record<string, boolean>;

  const result = {} as CwsListing['privacy']['certifications'];
  for (const [field, prefix] of Object.entries(CERTIFICATION_LABEL_PREFIXES) as [
    keyof typeof CERTIFICATION_LABEL_PREFIXES,
    string,
  ][]) {
    const match = Object.entries(checkedByLabel).find(([label]) =>
      label.toLowerCase().startsWith(prefix.toLowerCase()),
    );
    result[field] = match ? match[1] : false;
  }
  return result;
}

/**
 * Reads data use disclosure into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readDataUseDisclosure(
  page: Page,
): Promise<CwsListing['privacy']['dataUseDisclosure']> {
  const checkedByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const el of Array.from(document.querySelectorAll('input[type="checkbox"][aria-label]'))) {
      const label = el.getAttribute('aria-label') || '';
      out[label] = !!el.checked;
    }
    return out;
  })()`)) as Record<string, boolean>;

  const allMissing = Object.values(DATA_USE_LABELS).every((label) => !(label in checkedByLabel));
  if (allMissing) return;

  const result = {} as DataUseDisclosure;
  for (const [field, label] of Object.entries(DATA_USE_LABELS) as [
    keyof typeof DATA_USE_LABELS,
    string,
  ][]) {
    result[field] = checkedByLabel[label] ?? false;
  }
  return result;
}

/**
 * Reads distribution radios into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readDistributionRadios(page: Page): Promise<{
  payments: CwsListing['distribution']['payments'];
  visibility: CwsListing['distribution']['visibility'];
}> {
  const radioByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const inp of Array.from(document.querySelectorAll('input[type="radio"]'))) {
      const labelledById = inp.getAttribute('aria-labelledby');
      let label = '';
      if (labelledById) {
        const ref = document.getElementById(labelledById);
        if (ref) label = (ref.textContent || '').trim();
      }
      if (!label) {
        const wrap = inp.closest('label');
        if (wrap) label = (wrap.textContent || '').trim();
      }
      out[label] = !!inp.checked;
    }
    return out;
  })()`)) as Record<string, boolean>;

  const payments = radioByLabel['Contains in-app purchases']
    ? 'Contains in-app purchases'
    : 'Free of charge';
  let visibility: CwsListing['distribution']['visibility'] = 'Public';
  if (radioByLabel.Unlisted) {
    visibility = 'Unlisted';
  } else if (radioByLabel.Private) {
    visibility = 'Private';
  }

  return { payments, visibility };
}

/**
 * Reads listing comboboxes into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readListingComboboxes(page: Page): Promise<{
  category: string;
  language: string;
  officialUrl: string | undefined;
}> {
  const comboboxes = await readComboboxes(page, Object.values(LISTING_COMBOBOX_LABELS));
  return {
    category: comboboxes.Category ?? '',
    language: comboboxes.Language ?? '',
    officialUrl: comboboxes['Official URL'],
  };
}

/**
 * Reads optional text into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readOptionalText(page: Page, fieldKey: string): Promise<string | undefined> {
  try {
    const value = await fieldLocator(page, fieldKey).inputValue();
    return value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reads permissions justifications into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readPermissionsJustifications(page: Page): Promise<Record<string, string>> {
  try {
    const entries = await page.evaluate(`(() => {
      const out = [];
      for (const ta of Array.from(document.querySelectorAll('textarea'))) {
        const labelledById = ta.getAttribute('aria-labelledby');
        let label = '';
        if (labelledById) {
          const ref = document.getElementById(labelledById);
          if (ref) label = (ref.textContent || '').trim();
        }
        if (!label) {
          const wrap = ta.closest('label');
          if (wrap) label = (wrap.textContent || '').trim();
        }
        const match = label.match(/^(.+?)\\s+justification\\b/i);
        if (!match) continue;
        out.push({ permission: match[1].trim(), value: (ta.value || '').trim() });
      }
      return out;
    })()`);
    const list = entries as Array<{ permission: string; value: string }>;
    const result: Record<string, string> = {};
    for (const { permission, value } of list) {
      if (permission && value) result[permission] = value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Reads regions into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readRegions(page: Page): Promise<Record<string, boolean>> {
  const regionEntries = (await page.evaluate(`(() => {
    const out = [];
    for (const li of Array.from(document.querySelectorAll('li'))) {
      const cb = li.querySelector('input[type="checkbox"]');
      if (!cb) continue;
      const text = (li.textContent || '').trim().replace(/\\s+/g, ' ');
      if (!text) continue;
      out.push([text, !!cb.checked]);
    }
    return out;
  })()`)) as Array<[string, boolean]>;

  const regions: Record<string, boolean> = {};
  for (const [label, checked] of regionEntries) regions[label] = checked;
  return regions;
}

/**
 * Reads remote code justification into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readRemoteCodeJustification(page: Page): Promise<string | undefined> {
  const value = (await page.evaluate(`(() => {
    for (const ta of Array.from(document.querySelectorAll('textarea'))) {
      const labelledById = ta.getAttribute('aria-labelledby');
      let label = '';
      if (labelledById) {
        const ref = document.getElementById(labelledById);
        if (ref) label = (ref.textContent || '').trim();
      }
      if (label === 'Justification') return (ta.value || '').trim();
    }
    return '';
  })()`)) as string;
  return value.length > 0 ? value : undefined;
}

/**
 * Reads remote code radio into the schema shape expected by the Chrome Web Store automation pipeline.
 */
export async function readRemoteCodeRadio(page: Page): Promise<boolean> {
  return (await page.evaluate(`(() => {
    for (const inp of Array.from(document.querySelectorAll('input[type="radio"]'))) {
      const labelledById = inp.getAttribute('aria-labelledby');
      let label = '';
      if (labelledById) {
        const ref = document.getElementById(labelledById);
        if (ref) label = (ref.textContent || '').trim();
      }
      if (/^Yes, I am using Remote code/i.test(label)) return !!inp.checked;
    }
    return false;
  })()`)) as boolean;
}

/**
 * Updates listing combobox field through the supported Chrome Web Store automation interaction path.
 */
export async function setListingComboboxField(
  page: Page,
  field: string,
  desired: unknown,
): Promise<boolean> {
  const label = LISTING_COMBOBOX_LABELS[field];
  if (!label) return false;
  await setComboboxByLabel(page, label, desired);
  return true;
}

/**
 * Updates radio by label through the supported Chrome Web Store automation interaction path.
 */
export async function setRadioByLabel(page: Page, label: string): Promise<void> {
  const id = (await page.evaluate(
    `(() => {
      const wanted = ${JSON.stringify(label.toLowerCase())};
      for (const inp of Array.from(document.querySelectorAll('input[type="radio"]'))) {
        const labelledById = inp.getAttribute('aria-labelledby');
        let l = '';
        if (labelledById) {
          const ref = document.getElementById(labelledById);
          if (ref) l = (ref.textContent || '').trim();
        }
        if (!l) {
          const wrap = inp.closest('label');
          if (wrap) l = (wrap.textContent || '').trim();
        }
        if (l.toLowerCase().startsWith(wanted) || l.toLowerCase() === wanted) {
          if (!inp.id) inp.id = 'cws-radio-' + Math.random().toString(36).slice(2, 10);
          return inp.id;
        }
      }
      return null;
    })()`,
  )) as null | string;

  if (!id) throw new Error(`Could not find radio matching "${label}".`);
  await page.locator(`#${id}`).check();
}

/**
 * Updates remote code radio through the supported Chrome Web Store automation interaction path.
 */
export async function setRemoteCodeRadio(page: Page, desired: boolean): Promise<void> {
  const targetPrefix = desired ? 'Yes, I am using Remote code' : 'No, I am not using Remote code';
  await setRadioByLabel(page, targetPrefix);
}

/**
 * Updates switch by key through the supported Chrome Web Store automation interaction path.
 */
export async function setSwitchByKey(
  page: Page,
  fieldKey: string,
  desired: boolean,
): Promise<void> {
  const target = fieldLocator(page, fieldKey);
  const current = (await target.getAttribute('aria-checked')) === 'true';
  if (current === desired) return;
  await safeClick(target, 'updateListing');
}

async function readComboboxes(
  page: Page,
  labels: readonly string[],
): Promise<Record<string, string | undefined>> {
  const found = (await page.evaluate(
    `(() => {
      const out = {};
      for (const el of Array.from(document.querySelectorAll('[role="combobox"]'))) {
        const labelledBy = el.getAttribute('aria-labelledby');
        let labelText = '';
        if (labelledBy) {
          const ref = document.getElementById(labelledBy);
          if (ref) labelText = (ref.textContent || '').trim();
        }
        const fullText = (el.textContent || '').replace(/\\s+/g, ' ').trim();
        out[labelText || fullText] = fullText;
      }
      return out;
    })()`,
  )) as Record<string, string>;

  const result: Record<string, string | undefined> = {};
  for (const label of labels) {
    const fullText = Object.entries(found).find(([key]) =>
      key.toLowerCase().startsWith(label.toLowerCase()),
    )?.[1];
    if (!fullText) {
      result[label] = undefined;
      continue;
    }
    const stripped = fullText.slice(label.length).trim();
    result[label] = !stripped || stripped.toLowerCase() === 'none' ? undefined : stripped;
  }
  return result;
}

function screenshotIndex(label: string): number {
  const match = label.match(/^Screenshot\s+(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

async function setComboboxByLabel(page: Page, label: string, desired: unknown): Promise<void> {
  const target = typeof desired === 'string' && desired.length > 0 ? desired : 'None';

  const opened = await page.evaluate(
    `(() => {
      const labelLower = ${JSON.stringify(label.toLowerCase())};
      for (const el of Array.from(document.querySelectorAll('[role="combobox"]'))) {
        const labelledBy = el.getAttribute('aria-labelledby');
        let labelText = '';
        if (labelledBy) {
          const ref = document.getElementById(labelledBy);
          if (ref) labelText = (ref.textContent || '').trim();
        }
        const fullText = (el.textContent || '').replace(/\\s+/g, ' ').trim();
        const haystack = (labelText || fullText).toLowerCase();
        if (!haystack.startsWith(labelLower)) continue;
        el.click();
        return true;
      }
      return false;
    })()`,
  );
  if (!opened) {
    throw new Error(`Could not find combobox labelled "${label}" on the listing tab.`);
  }

  const option = page.getByRole('option', { exact: true, name: target }).first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await safeClick(option, 'updateListing');
}
