import type { Page } from 'playwright';
import {
  CERTIFICATION_LABEL_PREFIXES,
  DATA_USE_LABELS,
  FILE_UPLOAD_FIELDS,
  LISTING_COMBOBOX_LABELS,
} from './listingSourceTypes';
import { fieldLocator } from './locator';
import { safeClick } from './safeClick';

/**
 * Normalize unknown input into a boolean record for listing patch helpers.
 *
 * @param value - Unknown before/after value from a listing diff.
 * @returns A boolean record or an empty record when the value is absent.
 * @example
 * const map = booleanRecordFromUnknown({ enabled: true });
 */
const booleanRecordFromUnknown = (value: unknown): Record<string, boolean> => {
  if (value === undefined || value === null) {
    return {};
  }
  return value as Record<string, boolean>;
};

/**
 * Normalize unknown input into a string record for listing patch helpers.
 *
 * @param value - Unknown before/after value from a listing diff.
 * @returns A string record or an empty record when the value is absent.
 * @example
 * const map = stringRecordFromUnknown({ storage: 'Used for sync' });
 */
const stringRecordFromUnknown = (value: unknown): Record<string, string> => {
  if (value === undefined || value === null) {
    return {};
  }
  return value as Record<string, string>;
};

/**
 * Applies certifications changes from the local model into the CWS automation form.
 *
 * @param page - Chrome Web Store privacy page.
 * @param before - Previous certifications object.
 * @param after - Desired certifications object.
 * @returns A promise that resolves after changed certifications are applied.
 * @example
 * await applyCertifications(page, before.privacy.certifications, after.privacy.certifications);
 */
export const applyCertifications = async (
  page: Page,
  before: unknown,
  after: unknown,
): Promise<void> => {
  const beforeMap = booleanRecordFromUnknown(before);
  const afterMap = booleanRecordFromUnknown(after);

  for (const [field, prefix] of Object.entries(CERTIFICATION_LABEL_PREFIXES)) {
    const desired = Boolean(afterMap[field]);
    const current = Boolean(beforeMap[field]);
    if (desired !== current) {
      // biome-ignore lint/performance/noAwaitInLoops: CWS UI writes must preserve field order.
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
      if (id === null) {
        throw new Error(
          `Certification checkbox starting with "${prefix}" not found on the privacy tab.`,
        );
      }
      const checkbox = page.locator(`#${id}`);
      if (desired) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }
  }
};

/**
 * Applies data-use disclosure changes from the local model into the CWS automation form.
 *
 * @param page - Chrome Web Store privacy page.
 * @param before - Previous data-use disclosure object.
 * @param after - Desired data-use disclosure object.
 * @returns A promise that resolves after changed disclosures are applied.
 * @example
 * await applyDataUseDisclosure(page, before.privacy.dataUseDisclosure, after.privacy.dataUseDisclosure);
 */
export const applyDataUseDisclosure = async (
  page: Page,
  before: unknown,
  after: unknown,
): Promise<void> => {
  const beforeMap = booleanRecordFromUnknown(before);
  const afterMap = booleanRecordFromUnknown(after);

  for (const [field, label] of Object.entries(DATA_USE_LABELS)) {
    const desired = Boolean(afterMap[field]);
    const current = Boolean(beforeMap[field]);
    if (desired !== current) {
      const checkbox = page.locator(`input[type="checkbox"][aria-label="${label}"]`).first();
      if (desired) {
        // biome-ignore lint/performance/noAwaitInLoops: CWS UI writes must preserve field order.
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }
  }
};

/**
 * Applies permissions justification changes from the local model into the CWS automation form.
 *
 * @param page - Chrome Web Store privacy page.
 * @param before - Previous permission justifications.
 * @param after - Desired permission justifications.
 * @returns A promise that resolves after justifications are applied.
 * @example
 * await applyPermissionsJustification(page, before.privacy.permissionsJustification, after.privacy.permissionsJustification);
 */
export const applyPermissionsJustification = async (
  page: Page,
  before: unknown,
  after: unknown,
): Promise<void> => {
  const beforeMap = stringRecordFromUnknown(before);
  const afterMap = stringRecordFromUnknown(after);

  for (const [permission, value] of Object.entries(afterMap)) {
    if (beforeMap[permission] !== value) {
      // biome-ignore lint/performance/noAwaitInLoops: CWS UI writes must preserve field order.
      await fillTextareaByLabelPrefix(page, `${permission} justification`, value);
    }
  }
  for (const permission of Object.keys(beforeMap)) {
    if (!(permission in afterMap)) {
      // biome-ignore lint/performance/noAwaitInLoops: CWS UI writes must preserve field order.
      await fillTextareaByLabelPrefix(page, `${permission} justification`, '');
    }
  }
};

/**
 * Applies regions changes from the local model into the CWS automation form.
 *
 * @param page - Chrome Web Store distribution page.
 * @param before - Previous regions object.
 * @param after - Desired regions object.
 * @returns A promise that resolves after changed regions are applied.
 * @example
 * await applyRegions(page, before.distribution.regions, after.distribution.regions);
 */
export const applyRegions = async (page: Page, before: unknown, after: unknown): Promise<void> => {
  const beforeMap = booleanRecordFromUnknown(before);
  const afterMap = booleanRecordFromUnknown(after);

  await page
    .getByRole('button', { name: 'Show more' })
    .first()
    .click({ timeout: 1500 })
    .catch(() => undefined);

  const idByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const li of Array.from(document.querySelectorAll('li'))) {
      const cb = li.querySelector('input[type="checkbox"]');
      if (cb) {
        const text = (li.textContent || '').trim().replace(/\\s+/g, ' ');
        if (text) {
          if (!li.id) li.id = 'cws-region-li-' + Math.random().toString(36).slice(2, 10);
          out[text] = li.id;
        }
      }
    }
    return out;
  })()`)) as Record<string, string>;

  for (const [label, desired] of Object.entries(afterMap)) {
    if (Boolean(beforeMap[label]) !== Boolean(desired)) {
      const id = idByLabel[label];
      if (id === undefined) {
        throw new Error(
          `Region "${label}" not found on the distribution page. The dev console may have renamed or removed it; re-run \`pnpm cws import-listing\` to refresh.`,
        );
      }
      const li = page.locator(`#${id}`);
      // biome-ignore lint/performance/noAwaitInLoops: CWS UI writes must preserve field order.
      const isChecked = await li
        .getByRole('checkbox')
        .first()
        .isChecked()
        .catch(() => false);
      if (isChecked !== Boolean(desired)) {
        await li.click();
      }
    }
  }
};

/**
 * Fills the first textarea whose label starts with the requested prefix.
 *
 * @param page - Chrome Web Store page containing textareas.
 * @param prefix - Lowercase label prefix to match.
 * @param value - Text to fill into the matching textarea.
 * @returns A promise that resolves after the textarea is filled.
 * @example
 * await fillTextareaByLabelPrefix(page, 'storage justification', 'Needed for sync');
 */
export const fillTextareaByLabelPrefix = async (
  page: Page,
  prefix: string,
  value: string,
): Promise<void> => {
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
        if (label.toLowerCase().startsWith(prefixLower)) {
          if (!ta.id) ta.id = 'cws-fill-' + Math.random().toString(36).slice(2, 10);
          return ta.id;
        }
      }
      return null;
    })()`,
  )) as null | string;

  if (id === null) {
    throw new Error(
      `Could not find textarea labelled "${prefix}". The dev console may have renamed the field, or the permission is not declared on this listing.`,
    );
  }
  await page.locator(`#${id}`).fill(value);
};

/**
 * Reports whether a listing field requires a real file upload.
 *
 * @param field - Listing field path.
 * @returns True when the field requires a real file upload.
 * @example
 * const upload = isFileUploadField('listing.icon');
 */
export const isFileUploadField = (field: string): boolean => FILE_UPLOAD_FIELDS.has(field);

/**
 * Updates a listing combobox field through the supported CWS interaction path.
 *
 * @param page - Chrome Web Store listing page.
 * @param field - Listing field path.
 * @param desired - Desired combobox value.
 * @returns True when the field was a supported combobox field.
 * @example
 * const handled = await setListingComboboxField(page, 'listing.category', 'Productivity');
 */
export const setListingComboboxField = async (
  page: Page,
  field: string,
  desired: unknown,
): Promise<boolean> => {
  const label = LISTING_COMBOBOX_LABELS[field];
  if (label === undefined) {
    return false;
  }
  await setComboboxByLabel(page, label, desired);
  return true;
};

/**
 * Updates a radio group by visible label.
 *
 * @param page - Chrome Web Store page containing radio inputs.
 * @param label - Visible label prefix or full label to select.
 * @returns A promise that resolves after the radio is selected.
 * @example
 * await setRadioByLabel(page, 'Public');
 */
export const setRadioByLabel = async (page: Page, label: string): Promise<void> => {
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

  if (id === null) {
    throw new Error(`Could not find radio matching "${label}".`);
  }
  await page.locator(`#${id}`).check();
};

/**
 * Updates the remote-code radio selection.
 *
 * @param page - Chrome Web Store privacy page.
 * @param desired - Whether remote code should be marked as used.
 * @returns A promise that resolves after the radio is selected.
 * @example
 * await setRemoteCodeRadio(page, false);
 */
export const setRemoteCodeRadio = async (page: Page, desired: boolean): Promise<void> => {
  const targetPrefix = desired ? 'Yes, I am using Remote code' : 'No, I am not using Remote code';
  await setRadioByLabel(page, targetPrefix);
};

/**
 * Updates a switch by selector key when its current state differs.
 *
 * @param page - Chrome Web Store page containing the switch.
 * @param fieldKey - Selector inventory field key.
 * @param desired - Desired switch state.
 * @returns A promise that resolves after the switch is in the desired state.
 * @example
 * await setSwitchByKey(page, 'listing.matureContent', false);
 */
export const setSwitchByKey = async (
  page: Page,
  fieldKey: string,
  desired: boolean,
): Promise<void> => {
  const target = fieldLocator(page, fieldKey);
  const current = (await target.getAttribute('aria-checked')) === 'true';
  if (current !== desired) {
    await safeClick(target, 'updateListing');
  }
};

/**
 * Selects a combobox option by visible label.
 *
 * @param page - Chrome Web Store page containing the combobox.
 * @param label - Combobox label prefix.
 * @param desired - Desired option value; blank values select `None`.
 * @returns A promise that resolves after the option is selected.
 * @example
 * await setComboboxByLabel(page, 'Category', 'Productivity');
 */
const setComboboxByLabel = async (page: Page, label: string, desired: unknown): Promise<void> => {
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
        if (haystack.startsWith(labelLower)) {
          el.click();
          return true;
        }
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
};
