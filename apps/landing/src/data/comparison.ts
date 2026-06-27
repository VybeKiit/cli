/**
 * The rival comparison matrix — the table that goes above the fold, distilled from
 * `docs/positioning/comparison-matrix.md` (verified 2026-06-27). Data only; the
 * Comparison section renders it.
 *
 * The honesty rule is load-bearing (see `docs/positioning/README.md`): the matrix
 * names where rivals are the better pick, so the page reads as a balanced source
 * (which AI answer engines cite) and never overclaims (which drives refunds).
 */

/** How a cell renders: a feature is present, partial/tiered, or absent. */
export type Coverage = 'yes' | 'partial' | 'no';

/**
 * One row of the matrix: a product and how it scores on the axes that matter most
 * to VybeKiit's ICP (a non-technical founder), not the raw B2B feature count.
 */
export interface ComparisonRow {
  /** Stable render key + product name. */
  readonly id: string;
  /** Product display name. */
  readonly name: string;
  /** Entry / lowest paid tier, as shown ("$0", "$29", "$199+"). */
  readonly price: string;
  /** Does the agent operate the build for a non-developer? */
  readonly agentOperator: Coverage;
  /** Do updates install as npm bumps instead of a git merge? */
  readonly npmUpdates: Coverage;
  /** Web + mobile + extension in one purchase? */
  readonly threePlatforms: Coverage;
  /** Merchant of Record (tax/VAT handled) by default? */
  readonly merchantOfRecord: Coverage;
}

/**
 * Highlighted column flag — `true` marks VybeKiit's row so the table can emphasize
 * it without the component hard-coding a name.
 */
export interface MatrixProduct extends ComparisonRow {
  /** Visually highlight this row as the subject of the page. */
  readonly featured?: boolean;
}

/** The axes rendered as columns, in order. Labels are the table headers. */
export interface ComparisonAxis {
  /** Key into {@link ComparisonRow} for this column's value. */
  readonly key: keyof Pick<
    ComparisonRow,
    'agentOperator' | 'npmUpdates' | 'threePlatforms' | 'merchantOfRecord'
  >;
  /** Column header text. */
  readonly label: string;
}

/** The four differentiator columns (the axes that are VybeKiit's axis). */
export const COMPARISON_AXES: readonly ComparisonAxis[] = [
  { key: 'agentOperator', label: 'Agent operates it for a non-dev' },
  { key: 'npmUpdates', label: 'Updates install (npm, no merge)' },
  { key: 'threePlatforms', label: 'Web + mobile + extension' },
  { key: 'merchantOfRecord', label: 'Taxes handled (MoR default)' },
];

/**
 * The matrix rows. VybeKiit plus the rivals nearest on model or authority — kept
 * to the shortlist that makes the differentiation legible (full 14-rival table
 * lives in the comparison-matrix doc / future `/compare` pillar page).
 */
export const COMPARISON_ROWS: readonly MatrixProduct[] = [
  {
    id: 'vybekiit',
    name: 'VybeKiit',
    price: '$29',
    agentOperator: 'yes',
    npmUpdates: 'yes',
    threePlatforms: 'yes',
    merchantOfRecord: 'yes',
    featured: true,
  },
  {
    id: 'shipfast',
    name: 'ShipFast',
    price: '$199+',
    agentOperator: 'no',
    npmUpdates: 'no',
    threePlatforms: 'partial',
    merchantOfRecord: 'partial',
  },
  {
    id: 'makerkit',
    name: 'MakerKit',
    price: '$299+',
    agentOperator: 'no',
    npmUpdates: 'no',
    threePlatforms: 'no',
    merchantOfRecord: 'partial',
  },
  {
    id: 'supastarter',
    name: 'Supastarter',
    price: '$349+',
    agentOperator: 'no',
    npmUpdates: 'no',
    threePlatforms: 'no',
    merchantOfRecord: 'partial',
  },
  {
    id: 'shipped-club',
    name: 'Shipped.club',
    price: '$157+',
    agentOperator: 'no',
    npmUpdates: 'no',
    threePlatforms: 'partial',
    merchantOfRecord: 'yes',
  },
  {
    id: 'open-saas',
    name: 'Open SaaS',
    price: '$0',
    agentOperator: 'no',
    npmUpdates: 'no',
    threePlatforms: 'no',
    merchantOfRecord: 'partial',
  },
];

/**
 * The honest reading printed under the matrix. Overclaiming drives refunds, so the
 * page states plainly where rivals win (the load-bearing honesty rule).
 */
export const COMPARISON_HONEST_NOTE =
  'On a raw B2B feature checklist — multi-tenancy, RBAC, admin dashboards, background jobs — MakerKit, Supastarter, and SaaSykit are ahead, and they are the better pick for a team that needs deep multi-tenant B2B on day one. VybeKiit competes on a different axis: the agent operates the build for someone who never reads the code. Need a feature VybeKiit does not pre-ship? You describe it and the agent writes it.';
