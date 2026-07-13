'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@vybekiit/ui/sidebar';
import { BarChart2, Home, LayoutDashboard, LogOut, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Home', icon: Home },
  { label: 'Analytics', icon: BarChart2 },
  { label: 'Settings', icon: Settings },
] as const;

/** Minimal static Sidebar bounded in a fixed-height box — collapsible="none" renders inline. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="relative h-80 w-full overflow-hidden rounded-md border">
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <span className="px-2 font-semibold text-sm">Vybekiit</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.map(({ label, icon: Icon }, idx) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton isActive={idx === 0}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LogOut />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </div>
  ),
};

export default story;
