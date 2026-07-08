'use client';

import { SidebarProvider } from '@vybekiit/ui/sidebar';
import { AppSidebar } from '@/components/sidebar-06/app-sidebar';

export default function Page() {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full">
        <AppSidebar />
      </div>
    </SidebarProvider>
  );
}
