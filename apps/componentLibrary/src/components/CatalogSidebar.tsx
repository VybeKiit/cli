'use client';

import { CATALOG_CATEGORIES, COMPONENT_CATALOG_COUNT } from '@library/data/catalog.meta';
import { TEMPLATE_SURFACE_NAV_ITEMS, type TemplateSurfaceId } from '@library/data/templateSurfaces';
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
import { LayoutGrid, MonitorSmartphone, PanelsTopLeft, Puzzle, Smartphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

type CatalogSurface = 'components' | 'pages' | TemplateSurfaceId;

interface PageGroupSummary {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

interface CatalogSidebarProps {
  readonly surface?: CatalogSurface;
  readonly category?: string;
  readonly onCategoryChange?: (slug: string) => void;
  readonly pageGroups?: readonly PageGroupSummary[];
  readonly activePageGroup?: string;
  readonly onPageGroupChange?: (id: string) => void;
}

interface PageGroupMenuLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  readonly groupId: string;
  readonly onPageGroupChange?: (id: string) => void;
  readonly children: ReactNode;
}

const templateSurfaceIcons: Record<TemplateSurfaceId, typeof LayoutGrid> = {
  'website-saas': MonitorSmartphone,
  'mobile-saas': Smartphone,
  'extension-saas': Puzzle,
};

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

const pageGroupHref = (groupId: string): string =>
  groupId === 'all' ? '/pages' : `/pages?group=${groupId}`;

const PageGroupMenuLink = ({
  groupId,
  onPageGroupChange,
  onClick,
  children,
  ...props
}: PageGroupMenuLinkProps) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        onPageGroupChange?.(groupId);
      }
    },
    [groupId, onClick, onPageGroupChange],
  );

  return (
    <Link {...props} href={pageGroupHref(groupId)} onClick={handleClick}>
      {children}
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
              {TEMPLATE_SURFACE_NAV_ITEMS.map((item) => {
                const Icon = templateSurfaceIcons[item.id];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild={true}
                      isActive={surface === item.id}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
                    asChild={true}
                    isActive={activePageGroup === 'all'}
                    tooltip={`All Page recipes (${pageCount})`}
                  >
                    <PageGroupMenuLink groupId="all" onPageGroupChange={onPageGroupChange}>
                      <span>All Pages</span>
                      <span className={cn('ms-auto text-xs tabular-nums opacity-70')}>
                        {pageCount}
                      </span>
                    </PageGroupMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {pageGroups.map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton
                      asChild={true}
                      isActive={activePageGroup === group.id}
                      tooltip={`${group.label} (${group.count})`}
                    >
                      <PageGroupMenuLink groupId={group.id} onPageGroupChange={onPageGroupChange}>
                        <span>{group.label}</span>
                        <span className="ms-auto text-xs tabular-nums opacity-70">
                          {group.count}
                        </span>
                      </PageGroupMenuLink>
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
