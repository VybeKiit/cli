/** Lemon Squeezy tax category dropdown options (`#vs2__listbox`). */
export const LS_TAX_CATEGORY_OPTIONS = [
  'Software as a service (SaaS) - personal use',
  'Software as a service (SaaS) - business use',
  'Software',
  'Online Video Content',
  'Information Service',
  'eBook',
  'Digital Graphic / Template',
  'Video Game',
  'AI as a Service (AIaaS) - Cloud Based',
  'AI as a Service (AIaaS) - Cloud Based & Downloaded',
  'Digital Goods or Services',
  'On Demand Online Courses',
] as const;

export type LsTaxCategoryOption = (typeof LS_TAX_CATEGORY_OPTIONS)[number];

export const LS_DEFAULT_TAX_CATEGORY: LsTaxCategoryOption = LS_TAX_CATEGORY_OPTIONS[0];
