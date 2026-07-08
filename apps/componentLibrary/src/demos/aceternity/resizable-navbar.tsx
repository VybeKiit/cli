'use client';

import { MobileNav, NavBody, Navbar, NavItems } from '@/components/aceternity/ui/resizable-navbar';

export default function ResizableNavbarPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <Navbar />
      <NavBody />
      <NavItems />
      <MobileNav />
    </div>
  );
}
