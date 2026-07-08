import type { Page } from 'playwright';
import {
  type AssetSlotsSnapshot,
  CERTIFICATION_LABEL_PREFIXES,
  DATA_USE_LABELS,
  type DataUseDisclosure,
  type DistributionRadiosSnapshot,
  LISTING_COMBOBOX_LABELS,
  type ListingComboboxSnapshot,
} from './listingSourceTypes';
import { fieldLocator } from './locator';
import type { CwsListing } from './schema';

// screenshot label: "Screenshot 2" -> match
const SCREENSHOT_LABEL_PATTERN = /^Screenshot\s+\d+$/i;

// screenshot label: "Screenshot 12" -> 12
const SCREENSHOT_INDEX_PATTERN = /^Screenshot\s+(\d+)$/i;

/**
 * Reads asset slots into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store listing page.
 * @returns Current asset slot labels shown by the dev console.
 * @example
 * const slots = await readAssetSlots(page);
 */
export const readAssetSlots = async (page: Page): Promise<AssetSlotsSnapshot> => {
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
    .filter((label) => SCREENSHOT_LABEL_PATTERN.test(label))
    .sort((a, b) => screenshotIndex(a) - screenshotIndex(b));

  return {
    icon: labels.includes('Store icon') ? 'Store icon' : undefined,
    promoTileMarquee: labels.includes('Marquee promo tile') ? 'Marquee promo tile' : undefined,
    promoTileSmall: labels.includes('Small promo tile') ? 'Small promo tile' : undefined,
    screenshots,
  };
};

/**
 * Reads certifications into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store privacy page.
 * @returns Current certifications state.
 * @example
 * const certifications = await readCertifications(page);
 */
export const readCertifications = async (
  page: Page,
): Promise<CwsListing['privacy']['certifications']> => {
  const checkedByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const el of Array.from(document.querySelectorAll('input[type="checkbox"][aria-label]'))) {
      out[el.getAttribute('aria-label') || ''] = !!el.checked;
    }
    return out;
  })()`)) as Record<string, boolean>;

  const result = {} as Record<keyof CwsListing['privacy']['certifications'], boolean>;
  for (const [field, prefix] of Object.entries(CERTIFICATION_LABEL_PREFIXES) as [
    keyof typeof CERTIFICATION_LABEL_PREFIXES,
    string,
  ][]) {
    const match = Object.entries(checkedByLabel).find(([label]) =>
      label.toLowerCase().startsWith(prefix.toLowerCase()),
    );
    result[field] = match === undefined ? false : match[1];
  }
  return result;
};

/**
 * Reads data-use disclosure into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store privacy page.
 * @returns Current data-use disclosure, or undefined when the section is absent.
 * @example
 * const disclosure = await readDataUseDisclosure(page);
 */
export const readDataUseDisclosure = async (
  page: Page,
): Promise<CwsListing['privacy']['dataUseDisclosure']> => {
  const checkedByLabel = (await page.evaluate(`(() => {
    const out = {};
    for (const el of Array.from(document.querySelectorAll('input[type="checkbox"][aria-label]'))) {
      const label = el.getAttribute('aria-label') || '';
      out[label] = !!el.checked;
    }
    return out;
  })()`)) as Record<string, boolean>;

  const allMissing = Object.values(DATA_USE_LABELS).every((label) => !(label in checkedByLabel));
  if (allMissing) {
    return;
  }

  const result = {} as Record<keyof DataUseDisclosure, boolean>;
  for (const [field, label] of Object.entries(DATA_USE_LABELS) as [
    keyof typeof DATA_USE_LABELS,
    string,
  ][]) {
    const checked = checkedByLabel[label];
    result[field] = checked === undefined ? false : checked;
  }
  return result;
};

/**
 * Reads distribution radios into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store distribution page.
 * @returns Current payment and visibility radio selections.
 * @example
 * const radios = await readDistributionRadios(page);
 */
export const readDistributionRadios = async (page: Page): Promise<DistributionRadiosSnapshot> => {
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
};

/**
 * Reads listing comboboxes into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store listing page.
 * @returns Current category, language, and official URL combobox values.
 * @example
 * const comboboxes = await readListingComboboxes(page);
 */
export const readListingComboboxes = async (page: Page): Promise<ListingComboboxSnapshot> => {
  const comboboxes = await readComboboxes(page, Object.values(LISTING_COMBOBOX_LABELS));
  const category = comboboxes.Category;
  const language = comboboxes.Language;
  return {
    category: category === undefined ? '' : category,
    language: language === undefined ? '' : language,
    officialUrl: comboboxes['Official URL'],
  };
};

/**
 * Reads optional text into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store page containing the field.
 * @param fieldKey - Selector inventory field key.
 * @returns Non-empty field text, or undefined when absent.
 * @example
 * const supportUrl = await readOptionalText(page, 'listing.supportUrl');
 */
export const readOptionalText = async (
  page: Page,
  fieldKey: string,
): Promise<string | undefined> => {
  const value = await fieldLocator(page, fieldKey)
    .inputValue()
    .catch(() => undefined);
  return value && value.length > 0 ? value : undefined;
};

/**
 * Reads permissions justifications into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store privacy page.
 * @returns Permission justification map keyed by permission name.
 * @example
 * const justifications = await readPermissionsJustifications(page);
 */
export const readPermissionsJustifications = async (
  page: Page,
): Promise<Record<string, string>> => {
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
        if (match) {
          out.push({ permission: match[1].trim(), value: (ta.value || '').trim() });
        }
      }
      return out;
    })()`);
    const list = entries as Array<{ permission: string; value: string }>;
    const result: Record<string, string> = {};
    for (const { permission, value } of list) {
      if (permission.length > 0 && value.length > 0) {
        result[permission] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
};

/**
 * Reads regions into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store distribution page.
 * @returns Region checkbox map keyed by visible region label.
 * @example
 * const regions = await readRegions(page);
 */
export const readRegions = async (page: Page): Promise<Record<string, boolean>> => {
  const regionEntries = (await page.evaluate(`(() => {
    const out = [];
    for (const li of Array.from(document.querySelectorAll('li'))) {
      const cb = li.querySelector('input[type="checkbox"]');
      if (cb) {
        const text = (li.textContent || '').trim().replace(/\\s+/g, ' ');
        if (text) {
          out.push([text, !!cb.checked]);
        }
      }
    }
    return out;
  })()`)) as [string, boolean][];

  const regions: Record<string, boolean> = {};
  for (const [label, checked] of regionEntries) {
    regions[label] = checked;
  }
  return regions;
};

/**
 * Reads remote code justification into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store privacy page.
 * @returns Non-empty remote-code justification, or undefined when absent.
 * @example
 * const justification = await readRemoteCodeJustification(page);
 */
export const readRemoteCodeJustification = async (page: Page): Promise<string | undefined> => {
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
};

/**
 * Reads remote code radio into the schema shape expected by the CWS automation pipeline.
 *
 * @param page - Chrome Web Store privacy page.
 * @returns True when the remote-code "Yes" radio is selected.
 * @example
 * const usesRemoteCode = await readRemoteCodeRadio(page);
 */
export const readRemoteCodeRadio = async (page: Page): Promise<boolean> =>
  (await page.evaluate(`(() => {
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

/**
 * Read combobox values by label prefix.
 *
 * @param page - Chrome Web Store page containing comboboxes.
 * @param labels - Label prefixes to read.
 * @returns Combobox values keyed by requested label.
 * @example
 * const values = await readComboboxes(page, ['Category', 'Language']);
 */
const readComboboxes = async (
  page: Page,
  labels: readonly string[],
): Promise<Record<string, string | undefined>> => {
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
    const foundEntry = Object.entries(found).find(([key]) =>
      key.toLowerCase().startsWith(label.toLowerCase()),
    );
    const fullText = foundEntry === undefined ? undefined : foundEntry[1];
    if (fullText === undefined || fullText.length === 0) {
      result[label] = undefined;
    } else {
      const stripped = fullText.slice(label.length).trim();
      result[label] =
        stripped.length === 0 || stripped.toLowerCase() === 'none' ? undefined : stripped;
    }
  }
  return result;
};

/**
 * Read the numeric order from a screenshot label.
 *
 * @param label - Screenshot label from the CWS UI.
 * @returns Screenshot index, or 0 when the label does not contain one.
 * @example
 * const index = screenshotIndex('Screenshot 2');
 */
const screenshotIndex = (label: string): number => {
  const match = label.match(SCREENSHOT_INDEX_PATTERN);
  if (match === null || match[1] === undefined) {
    return 0;
  }
  return Number(match[1]);
};
