'use client';

import { CATALOG_CATEGORIES, COMPONENT_CATALOG_COUNT } from '@library/data/catalog.meta';
import { prefetchCategoryShard } from '@library/lib/catalogFetch';
import Image from 'next/image';
import Link from 'next/link';
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
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface CatalogSidebarProps {
  readonly category: string;
  readonly onCategoryChange: (slug: string) => void;
}

function SidebarBrand() {
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
}

/** Category navigation — shadcn sidebar with brand header and collapse toggle. */
export function CatalogSidebar({ category, onCategoryChange }: CatalogSidebarProps) {
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
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={category === 'all'}
                  onClick={() => onCategoryChange('all')}
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
                    onClick={() => onCategoryChange(item.slug)}
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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
