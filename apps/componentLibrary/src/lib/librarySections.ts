/** A top-level section of the component library, shown in the shared top bar. */
export interface LibrarySection {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

/** The primary sections, in top-bar order. */
export const LIBRARY_SECTIONS: readonly LibrarySection[] = [
  { id: 'components', label: 'Components', href: '/' },
  { id: 'design-system', label: 'Design system', href: '/design-system' },
  { id: 'recipes', label: 'Recipes', href: '/pages' },
  { id: 'templates', label: 'Templates', href: '/website-saas' },
  { id: 'changelog', label: 'Changelog', href: '/changelog' },
];

/**
 * The active section id for a pathname, so the top bar and sidebar agree on where you are.
 *
 * @param pathname - The current route pathname.
 * @returns The matching section id (defaults to `components`).
 * @example
 * sectionFromPathname('/design-system/chart'); // 'design-system'
 */
export const sectionFromPathname = (pathname: string): string => {
  if (pathname.startsWith('/design-system')) {
    return 'design-system';
  }
  if (pathname.startsWith('/pages')) {
    return 'recipes';
  }
  if (
    pathname.startsWith('/website-saas') ||
    pathname.startsWith('/mobile-saas') ||
    pathname.startsWith('/extension-saas')
  ) {
    return 'templates';
  }
  if (pathname.startsWith('/changelog')) {
    return 'changelog';
  }
  return 'components';
};
