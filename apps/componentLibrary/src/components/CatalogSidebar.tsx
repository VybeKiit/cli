'use client';

import { CATALOG_CATEGORIES, COMPONENT_CATALOG_COUNT } from '@library/data/catalog.meta';
import { prefetchCategoryShard } from '@library/lib/catalogFetch';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@vybekiit/ui/sidebar';
import { LayoutGrid, PanelsTopLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PageGroupSummary {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

interface CatalogSidebarProps {
  readonly surface?: 'components' | 'pages';
  readonly category?: string;
  readonly onCategoryChange?: (slug: string) => void;
  readonly pageGroups?: readonly PageGroupSummary[];
  readonly activePageGroup?: string;
  readonly onPageGroupChange?: (id: string) => void;
}

const SidebarBrand = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Link
      className="flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none ring-sidebar-ring transition hover:opacity-90 focus-visible:ring-2"
      href="/"
    >
      <Image
        alt=""
        className="size-8 shrink-0 rounded-lg"
        height={32}
        priority={true}
        src="/icon.svg"
        width={32}
      />
      {collapsed ? null : (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold text-sidebar-foreground text-sm">VybeKiit</span>
          <span className="truncate text-sidebar-foreground/60 text-xs">UI Library</span>
        </span>
      )}
    </Link>
  );
};

/**
 * Render the catalog sidebar component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <CatalogSidebar {...props} />;
 */
export const CatalogSidebar = ({
  surface = 'components',
  category = 'all',
  onCategoryChange,
  pageGroups = [],
  activePageGroup = 'all',
  onPageGroupChange,
}: CatalogSidebarProps) => {
  const pageCount = pageGroups.reduce((count, group) => count + group.count, 0);

  return (
    <Sidebar collapsible="icon" data-tour="category-sidebar" variant="sidebar">
      <SidebarHeader className="border-sidebar-border border-b px-2 py-3">
        <div className="flex items-center gap-1">
          <SidebarBrand />
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild={true}
                  isActive={surface === 'components'}
                  tooltip="Components"
                >
                  <Link href="/">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Components</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild={true} isActive={surface === 'pages'} tooltip="Pages">
                  <Link href="/pages">
                    <PanelsTopLeft className="h-4 w-4" />
                    <span>Pages</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {surface === 'components' ? (
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={category === 'all'}
                    onClick={() => onCategoryChange?.('all')}
                    tooltip={`All (${COMPONENT_CATALOG_COUNT})`}
                    type="button"
                  >
                    <span>All</span>
                    <span className={cn('ms-auto text-xs tabular-nums opacity-70')}>
                      {COMPONENT_CATALOG_COUNT}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {CATALOG_CATEGORIES.map((item) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton
                      isActive={category === item.slug}
                      onClick={() => onCategoryChange?.(item.slug)}
                      onFocus={() => prefetchCategoryShard(item.slug)}
                      onMouseEnter={() => prefetchCategoryShard(item.slug)}
                      tooltip={`${item.label} (${item.count})`}
                      type="button"
                    >
                      <span>{item.label}</span>
                      <span className="ms-auto text-xs tabular-nums opacity-70">{item.count}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {surface === 'pages' ? (
          <SidebarGroup>
            <SidebarGroupLabel>Page Groups</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activePageGroup === 'all'}
                    onClick={() => onPageGroupChange?.('all')}
                    tooltip={`All Page recipes (${pageCount})`}
                    type="button"
                  >
                    <span>All Pages</span>
                    <span className={cn('ms-auto text-xs tabular-nums opacity-70')}>
                      {pageCount}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {pageGroups.map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton
                      isActive={activePageGroup === group.id}
                      onClick={() => onPageGroupChange?.(group.id)}
                      tooltip={`${group.label} (${group.count})`}
                      type="button"
                    >
                      <span>{group.label}</span>
                      <span className="ms-auto text-xs tabular-nums opacity-70">{group.count}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};
