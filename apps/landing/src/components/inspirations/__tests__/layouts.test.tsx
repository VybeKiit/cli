import { render } from '@testing-library/react';
import { INSPIRATION_DIRECTIONS } from '@/data/inspirations';
import { INSPIRATION_LAYOUTS } from '../LayoutRegistry';

/**
 * Gallery guard tests for the ten inspiration layouts (#35).
 *
 * The `/inspirations/[slug]` route is data-driven: `INSPIRATION_DIRECTIONS` feeds
 * the slugs and `INSPIRATION_LAYOUTS` maps each to a full-page component. These
 * tests fail the build if the two ever drift apart (a slug with no layout, or an
 * orphan layout) or if any layout throws on render — the silent breakage that a
 * ten-variant gallery is most prone to.
 */
describe('inspiration layouts', () => {
  const directions = INSPIRATION_DIRECTIONS;

  it('maps every direction slug to a layout component', () => {
    for (const direction of directions) {
      expect(INSPIRATION_LAYOUTS[direction.slug]).toBeDefined();
    }
  });

  it('has no orphan layouts without a matching direction', () => {
    const slugs = new Set(directions.map((d) => d.slug));
    for (const slug of Object.keys(INSPIRATION_LAYOUTS)) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it.each(
    directions.map((d) => [d.slug, d] as const),
  )('renders the %s layout with its headline', (slug, direction) => {
    const Layout = INSPIRATION_LAYOUTS[slug];
    if (!Layout) {
      throw new Error(`No layout registered for slug "${slug}"`);
    }
    const { container, unmount } = render(<Layout direction={direction} />);
    expect(container).not.toBeEmptyDOMElement();
    expect(container.textContent).toContain(direction.headline);
    unmount();
  });
});
