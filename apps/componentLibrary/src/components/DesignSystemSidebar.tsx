'use client';

import {
  DESIGN_SYSTEM_FAMILIES,
  PRIMITIVE_BY_SLUG,
  type PrimitiveDescriptor,
} from '@library/data/designSystem';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@vybekiit/ui/sidebar';
import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

/** The active primitive slug, derived from `/design-system/[slug]` (undefined on the index). */
const activeSlugFrom = (pathname: string): string | undefined => {
  const parts = pathname.split('/');
  return parts[1] === 'design-system' && parts[2] ? parts[2] : undefined;
};

/**
 * Left-nav for the design-system section: every family and primitive, searchable, with the
 * active primitive highlighted. Data comes from the generated design-system index, so the nav
 * can never drift from the primitives themselves.
 *
 * @returns The design-system sidebar.
 * @example
 * <DesignSystemSidebar />
 */
export const DesignSystemSidebar = () => {
  const pathname = usePathname();
  const activeSlug = activeSlugFrom(pathname);
  const [query, setQuery] = useState('');

  const families = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DESIGN_SYSTEM_FAMILIES.map((family) => ({
      name: family.name,
      primitives: family.primitives
        .map((slug) => PRIMITIVE_BY_SLUG[slug])
        .filter((primitive): primitive is PrimitiveDescriptor => primitive !== undefined)
        .filter(
          (primitive) =>
            needle === '' ||
            primitive.title.toLowerCase().includes(needle) ||
            primitive.slug.toLowerCase().includes(needle),
        ),
    })).filter((family) => family.primitives.length > 0);
  }, [query]);

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="gap-2 border-sidebar-border border-b px-2 py-3">
        <div className="flex items-center gap-1">
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
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-semibold text-sidebar-foreground text-sm">
                Design system
              </span>
              <span className="truncate text-sidebar-foreground/60 text-xs">@vybekiit/ui</span>
            </span>
          </Link>
          <SidebarTrigger className="shrink-0" />
        </div>
        <div className="relative">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 size-3.5 text-sidebar-foreground/50" />
          <SidebarInput
            aria-label="Search primitives"
            className="ps-7"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search primitives…"
            value={query}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {families.map((family) => (
          <SidebarGroup key={family.name}>
            <SidebarGroupLabel>{family.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {family.primitives.map((primitive) => (
                  <SidebarMenuItem key={primitive.slug}>
                    <SidebarMenuButton
                      asChild={true}
                      isActive={activeSlug === primitive.slug}
                      tooltip={primitive.title}
                    >
                      <Link href={`/design-system/${primitive.slug}`}>
                        <span className="truncate">{primitive.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {families.length === 0 ? (
          <p className="px-4 py-6 text-sidebar-foreground/60 text-sm">
            No primitives match your search.
          </p>
        ) : null}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};
