import type { ReactNode } from 'react';

/**
 * The contract a hand-authored override module exports for a behavioral or compound
 * primitive (Dialog, Select, Table…). Gallery-first and render-only: it lays out every
 * real variant, size, and state at once so the whole surface is visible without clicking.
 * Metadata (family, states, props) is derive-first and configured in
 * `buildDesignSystemIndex.mjs`. RTL and dark are applied by the renderer's preview stage,
 * so a module never needs to plumb them. See COMPONENT-STORY-AUTHORING.md.
 */
export interface PrimitiveStoryModule {
  /** Every real variant, size, and state laid out at once — real components, never mockups. */
  readonly ShowAll: () => ReactNode;
}
