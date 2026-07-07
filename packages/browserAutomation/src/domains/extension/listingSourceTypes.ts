import type { CwsListing } from './schema';

/**
 * Asset slots that require a real file path and dev-console upload support.
 */
export const FILE_UPLOAD_FIELDS = new Set<string>([
  'listing.icon',
  'listing.promoTileMarquee',
  'listing.promoTileSmall',
  'listing.screenshots',
]);

/**
 * Combobox-backed listing fields keyed by schema path.
 */
export const LISTING_COMBOBOX_LABELS: Record<string, string> = {
  'listing.category': 'Category',
  'listing.language': 'Language',
  'listing.officialUrl': 'Official URL',
};

/**
 * Certification checkbox label prefixes keyed by schema field.
 */
export const CERTIFICATION_LABEL_PREFIXES: Record<
  keyof CwsListing['privacy']['certifications'],
  string
> = {
  noCreditworthiness: 'I do not use or transfer user data to determine creditworthiness',
  noDataSale: 'I do not sell or transfer user data to third parties',
  noUnrelatedUse: 'I do not use or transfer user data for purposes that are unrelated',
};

/**
 * Data-use disclosure object with optionality stripped for checkbox mapping.
 */
export type DataUseDisclosure = NonNullable<CwsListing['privacy']['dataUseDisclosure']>;

/**
 * Data-use checkbox labels keyed by schema field.
 */
export const DATA_USE_LABELS: Record<keyof DataUseDisclosure, string> = {
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
 * Asset slot labels read from the Chrome Web Store listing page.
 */
export type AssetSlotsSnapshot = {
  readonly icon: string | undefined;
  readonly promoTileMarquee: string | undefined;
  readonly promoTileSmall: string | undefined;
  readonly screenshots: string[];
};

/**
 * Distribution radio values read from the Chrome Web Store distribution page.
 */
export type DistributionRadiosSnapshot = {
  readonly payments: CwsListing['distribution']['payments'];
  readonly visibility: CwsListing['distribution']['visibility'];
};

/**
 * Combobox values read from the Chrome Web Store listing page.
 */
export type ListingComboboxSnapshot = {
  readonly category: string;
  readonly language: string;
  readonly officialUrl: string | undefined;
};
