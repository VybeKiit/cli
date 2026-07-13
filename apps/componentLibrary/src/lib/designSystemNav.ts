import { DESIGN_SYSTEM_FAMILIES, PRIMITIVE_BY_SLUG } from '@library/data/designSystem';

/** Every primitive slug in family + display order — the canonical browse sequence. */
export const DESIGN_SYSTEM_SLUG_ORDER: readonly string[] = DESIGN_SYSTEM_FAMILIES.flatMap(
  (family) => family.primitives,
);

/** A minimal handle to a sibling primitive, for prev/next links. */
export interface PrimitiveSibling {
  readonly slug: string;
  readonly title: string;
}

const siblingFor = (slug: string | undefined): PrimitiveSibling | undefined => {
  if (slug === undefined) {
    return;
  }
  const primitive = PRIMITIVE_BY_SLUG[slug];
  return primitive === undefined ? undefined : { slug: primitive.slug, title: primitive.title };
};

/**
 * The previous and next primitive around a slug in browse order (no wraparound).
 *
 * @param slug - The current primitive slug.
 * @returns The prev/next siblings; each is undefined at the ends of the list.
 * @example
 * const { prev, next } = designSystemSiblings('chart');
 */
export const designSystemSiblings = (
  slug: string,
): { readonly prev?: PrimitiveSibling; readonly next?: PrimitiveSibling } => {
  const index = DESIGN_SYSTEM_SLUG_ORDER.indexOf(slug);
  if (index === -1) {
    return {};
  }
  return {
    prev: siblingFor(DESIGN_SYSTEM_SLUG_ORDER[index - 1]),
    next: siblingFor(DESIGN_SYSTEM_SLUG_ORDER[index + 1]),
  };
};
