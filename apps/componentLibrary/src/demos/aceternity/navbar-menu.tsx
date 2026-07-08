'use client';

import { HoveredLink, Menu, MenuItem, ProductItem } from '@/components/aceternity/ui/navbar-menu';

export default function NavbarMenuPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <MenuItem />
      <Menu />
      <ProductItem />
      <HoveredLink />
    </div>
  );
}
