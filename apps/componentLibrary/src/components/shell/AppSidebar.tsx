'use client';

import { CatalogSidebar } from '@library/components/CatalogSidebar';
import { DesignSystemSidebar } from '@library/components/DesignSystemSidebar';
import type { TemplateSurfaceId } from '@library/data/templateSurfaces';
import { sectionFromPathname } from '@library/lib/librarySections';
import { PAGE_RECIPE_GROUP_SUMMARIES } from '@library/lib/pageRecipeGroupSummaries';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const templateSurfaceFromPathname = (pathname: string): TemplateSurfaceId => {
  if (pathname.startsWith('/mobile-saas')) {
    return 'mobile-saas';
  }
  if (pathname.startsWith('/extension-saas')) {
    return 'extension-saas';
  }
  return 'website-saas';
};

/**
 * The section-aware left nav: it swaps its contents to match the active section (design-system
 * families, catalog categories, page groups, or template surfaces) while one `SidebarProvider`
 * in the shell keeps its open/collapsed state across navigations. Catalog category and page
 * group are driven by the URL, so the sidebar and each browser stay in sync without shared state.
 *
 * @returns The active section's sidebar, or nothing for chrome-light sections.
 * @example
 * <AppSidebar />
 */
export const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = sectionFromPathname(pathname);

  const onCategoryChange = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug === 'all') {
        params.delete('category');
      } else {
        params.set('category', slug);
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    },
    [router, searchParams],
  );

  if (section === 'design-system') {
    return <DesignSystemSidebar />;
  }
  if (section === 'changelog') {
    return null;
  }
  if (section === 'recipes') {
    return (
      <CatalogSidebar
        activePageGroup={searchParams.get('group') ?? 'all'}
        pageGroups={PAGE_RECIPE_GROUP_SUMMARIES}
        surface="pages"
      />
    );
  }
  if (section === 'templates') {
    return <CatalogSidebar surface={templateSurfaceFromPathname(pathname)} />;
  }
  return (
    <CatalogSidebar
      category={searchParams.get('category') ?? 'all'}
      onCategoryChange={onCategoryChange}
      surface="components"
    />
  );
};
