'use client';

import { GlobalThemeControls } from '@library/components/GlobalThemeControls';
import { LIBRARY_SECTIONS, sectionFromPathname } from '@library/lib/librarySections';
import { SidebarTrigger } from '@vybekiit/ui/sidebar';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * The persistent top bar shared across every library section: brand, cross-section nav with an
 * active state, and the global theme controls. It sits inside the sidebar inset (never over the
 * sidebar), so it reads like one product no matter which section you are in.
 *
 * @returns The shared top bar.
 * @example
 * <AppTopBar />
 */
export const AppTopBar = () => {
  const pathname = usePathname();
  const active = sectionFromPathname(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-4">
      <SidebarTrigger className="-ms-1 shrink-0" />
      <Link className="flex shrink-0 items-center gap-2" href="/">
        <Image
          alt=""
          className="size-7 rounded-md"
          height={28}
          priority={true}
          src="/icon.svg"
          width={28}
        />
        <span className="hidden font-semibold tracking-tight sm:inline">VybeKiit</span>
      </Link>
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {LIBRARY_SECTIONS.map((section) => (
          <Link
            className={cn(
              'shrink-0 rounded-md px-2.5 py-1.5 font-medium text-sm transition-colors',
              active === section.id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
            href={section.href}
            key={section.id}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      <div className="shrink-0">
        <GlobalThemeControls />
      </div>
    </header>
  );
};
