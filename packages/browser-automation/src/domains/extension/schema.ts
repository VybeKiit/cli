import { z } from 'zod';

/**
 * Zod schema for `extensions/<name>/cws-listing.ts` — the per-extension source
 * of truth for everything the Chrome Web Store dev-console pushes for this
 * package's verbs.
 *
 * Why this lives in a Zod schema rather than a plain TS type:
 *
 * - `importListing` writes this file from live CWS state, so values arrive
 *   as untrusted strings; the schema is the validation seam.
 * - `updateListing` reads the file at runtime, so the same schema validates
 *   on the way back. Drift between local and remote is a structural concept.
 * - The TS type is derived (`CwsListing = z.infer<typeof CwsListingSchema>`)
 *   so the typed source-of-truth file stays in sync with what the verbs
 *   actually accept.
 *
 * Why the schema is nested by tab (`listing.*`, `privacy.*`) rather than
 * flat:
 *   The dev console's edit form is split into tabs at the URL level
 *   (`/edit/listing`, `/edit/privacy`, …). Mirroring that split in the
 *   schema keeps push logic per-tab — `updateListing` navigates once per
 *   tab and applies only the fields that live there. A flat schema forced
 *   the verbs to special-case which keys belong to which tab; this shape
 *   makes that mapping a property of the data, not the code.
 *
 * Scope: this schema models every dev-console edit tab the verbs round-trip
 * today — `/edit/listing`, `/edit/privacy`, `/edit/distribution`,
 * `/edit/package`, and the read-only `/edit/status` tab. Each tab is its
 * own top-level group on the schema so push logic stays per-tab: navigate
 * once, write the fields that live there, save the draft.
 *
 * Field meanings track the Chrome Web Store dev-console form exactly. When
 * CWS adds a field, add it here first — the verbs cannot push a field this
 * schema does not know about.
 */
export const CwsListingSchema = z.object({
  /**
   * Distribution tab (`/edit/distribution`). Controls who can find and
   * install the listing — visibility, payment posture, and which countries
   * the listing is published to.
   */
  distribution: z.object({
    /**
     * "Payments" radio group. Most extensions are `'Free of charge'`. The
     * other option (`'Contains in-app purchases'`) means the extension
     * uses Chrome Web Store Payments, which is deprecated for new items.
     * Stored as the dev-console label so the writer can match exactly.
     */
    payments: z.enum(['Free of charge', 'Contains in-app purchases']),

    /**
     * Region-by-region distribution map. Keys are the dev-console's
     * region labels exactly as displayed (e.g. `"All regions"`,
     * `"Albania"`, `"Antigua & Barbuda"`); values are whether the listing
     * is enabled in that region. The schema accepts any string key
     * because Google adds and renames regions over time without notice.
     */
    regions: z.record(z.string(), z.boolean()),

    /**
     * Listing visibility. `'Public'` = listed in the store search,
     * `'Unlisted'` = installable by URL only, `'Private'` = restricted to
     * a trusted-tester group configured elsewhere on the page.
     */
    visibility: z.enum(['Public', 'Unlisted', 'Private']),
  }),

  /**
   * Store-listing tab (`/edit/listing`). Holds the marketing copy, links,
   * categorisation, and visual assets that show on the public store page.
   */
  listing: z.object({
    /**
     * CWS top-level category. The dev console uses one of a fixed set of
     * strings; the schema accepts the union.
     */
    category: z.enum([
      'Accessibility',
      'Art & Design',
      'Communication',
      'Developer Tools',
      'Education',
      'Entertainment',
      'Functionality & UI',
      'Games',
      'Household',
      'Just for Fun',
      'News & Weather',
      'Privacy & Security',
      'Productivity',
      'Shopping',
      'Social Networking',
      'Tools',
      'Travel',
      'Well-being',
      'Workflow & Planning',
    ]),

    /**
     * Detailed description shown on the listing page. CWS limit is 16,000
     * characters. Plain text — Markdown is not rendered.
     */
    description: z.string().min(1).max(16_000),

    /**
     * Optional URL to a YouTube video shown on the listing page. The
     * "Global promo video" field on `/edit/listing`. CWS only accepts
     * YouTube URLs; format validated server-side.
     */
    globalPromoVideo: z.string().url().optional(),

    /**
     * Optional homepage URL shown alongside the support link. Distinct from
     * `supportUrl`: the homepage is the marketing site; the support URL is
     * where users file bugs.
     */
    homepageUrl: z.string().url().optional(),

    /**
     * Repo-relative path to the listing icon (128x128 PNG). Optional;
     * defaults to the icon embedded in the manifest when unset.
     */
    icon: z.string().min(1).optional(),

    /**
     * Listing language as the dev-console combobox displays it (e.g.
     * "English", "Portuguese (Brazil)"). Stored as the UI label rather
     * than a BCP-47 code because the push path picks an option from the
     * combobox menu, which is keyed by label, not code.
     */
    language: z.string().min(1),

    /**
     * Whether the listing is flagged as containing mature content. CWS
     * surfaces a separate UI gate for these listings on signed-out users
     * and in some regions.
     */
    matureContent: z.boolean(),

    /**
     * "Official URL" combobox value — the dev console asks publishers to
     * pick which of their links is canonical for trust-and-safety
     * deduplication. Stored as the user-visible label so round-tripping
     * through `importListing` is exact.
     */
    officialUrl: z.string().min(1).optional(),

    /**
     * Repo-relative path to the marquee promo tile (1400x560 PNG/JPG).
     * Required only for items featured in the CWS marquee carousel;
     * otherwise leave undefined.
     */
    promoTileMarquee: z.string().min(1).optional(),

    /**
     * Repo-relative path to the small promo tile (440x280 PNG/JPG).
     * Optional — many listings ship without one. When present, replaces
     * the existing tile on push.
     */
    promoTileSmall: z.string().min(1).optional(),

    /**
     * Repo-relative paths to the screenshots in display order. CWS accepts
     * 1280x800 or 640x400 PNG/JPG. Order is preserved on the dev console;
     * reordering rewrites positions. May be empty when the global-assets
     * section has not yet been wired up by the recorder (asset selectors
     * are TBD per the probe). Cap is 10 — Google's docs say 5 but the dev
     * console accepts more for some listings (grandfathered or batched
     * uploads), and the schema must round-trip whatever the reader sees.
     */
    screenshots: z.array(z.string().min(1)).max(10).default([]),

    /**
     * Public support URL the listing surfaces (e.g. a GitHub Issues page).
     * CWS validates that the URL responds to a HEAD request.
     */
    supportUrl: z.string().url(),
  }),

  /**
   * Package tab (`/edit/package`). Most of this tab is action-oriented
   * (upload zip, roll back) rather than a persisted field. The one
   * persisted setting we capture today is the verified-CRX opt-in
   * checkbox.
   */
  package: z.object({
    /**
     * Whether the publisher has opted into verified CRX uploads (the
     * "Opt in" affordance under "Verified CRX uploads"). Once opted in,
     * Google requires every uploaded zip to carry a verification key;
     * opting out is currently not surfaced via UI, so this is treated as
     * a one-way switch on the write side (writes go opt-in only).
     */
    verifiedUploadsOptIn: z.boolean(),
  }),

  /**
   * Privacy practices tab (`/edit/privacy`). Reviewers read this tab first
   * when deciding whether requested permissions are proportional. The
   * "Remote code" radio + its justification textarea, the per-permission
   * justifications, the data-usage checklist, and the three "I do not …"
   * certifications are all part of this tab in the current dev-console
   * layout.
   */
  privacy: z.object({
    /**
     * The three "I certify …" checkboxes near the bottom of the privacy
     * tab. Reviewers gate publication on all three being checked.
     */
    certifications: z.object({
      /** "I do not use or transfer user data to determine creditworthiness …" */
      noCreditworthiness: z.boolean(),
      /** "I do not sell or transfer user data to third parties …" */
      noDataSale: z.boolean(),
      /** "I do not use or transfer user data for purposes that are unrelated …" */
      noUnrelatedUse: z.boolean(),
    }),

    /**
     * Per-data-type collection disclosures. The dev console's privacy form
     * is a flat checklist — each box ticked means the extension collects
     * that data type. There is no separate "do you collect any user data"
     * gate (Google removed it); the implicit answer is "yes" when any of
     * these are true.
     */
    dataUseDisclosure: z
      .object({
        collectsActivity: z.boolean(),
        collectsAuth: z.boolean(),
        collectsFinancial: z.boolean(),
        collectsHealth: z.boolean(),
        collectsLocation: z.boolean(),
        collectsPersonalCommunications: z.boolean(),
        collectsPii: z.boolean(),
        collectsWebHistory: z.boolean(),
        collectsWebsiteContent: z.boolean(),
      })
      .optional(),

    /**
     * Free-text justification of why each permission in `manifest.json` is
     * necessary, keyed by permission name. Reviewers cross-check against
     * actual code.
     */
    permissionsJustification: z.record(z.string(), z.string().min(1)),

    /**
     * Optional URL to the published privacy policy. Required for items
     * that disclose any data collection (i.e. any `dataUseDisclosure`
     * field is true).
     */
    privacyPolicyUrl: z.string().url().optional(),

    /**
     * Justification text for `usesRemoteCode === true`. Required by the dev
     * console only when remote code is in use; we keep it optional in the
     * schema so the no-remote-code happy path can leave it unset.
     */
    remoteCodeJustification: z.string().min(1).max(1000).optional(),

    /**
     * The "single purpose" justification CWS requires for every MV3
     * extension. Plain text, 1000 chars. Lives on the privacy tab in the
     * current dev-console layout.
     */
    singlePurpose: z.string().min(1).max(1000),

    /**
     * Whether the extension loads remote code at runtime (the "Remote code"
     * Yes/No radio on the privacy tab). Most MV3 extensions answer "no";
     * answering "yes" requires the matching `remoteCodeJustification`.
     */
    usesRemoteCode: z.boolean(),
  }),

  /**
   * Status tab (`/edit/status`). Read-only — `updateListing` never writes
   * anything here. We surface a snapshot so callers (CLI, agents) can
   * decide whether it's safe to push (e.g. "do not submit if the listing
   * is already in review").
   */
  status: z.object({
    /**
     * Current review-status badge text, classified into the well-known
     * states so callers can branch without parsing strings. `'unknown'`
     * is reserved for labels Google ships without notice.
     */
    review: z.enum(['draft', 'in_review', 'published', 'rejected', 'unknown']),

    /**
     * Plain-text label of the badge as the dev console rendered it.
     * Carried alongside `review` so logs and UIs can show the live
     * wording even when classification falls through to `'unknown'`.
     */
    reviewLabel: z.string(),
  }),
});

/**
 * Type derived from the schema. The per-extension `cws-listing.ts` file
 * exports a value of this shape (typed via `satisfies CwsListing`).
 */
export type CwsListing = z.infer<typeof CwsListingSchema>;
