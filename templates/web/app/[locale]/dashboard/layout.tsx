'use client';

import { DashboardGuard } from '@/components/dashboard-guard';
import { DashboardShell } from '@/components/dashboard-shell';
import { useUser } from '@/hooks/useUser';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  readonly children?: ReactNode;
}

/**
 * Protect dashboard routes and wrap them in signed-in chrome.
 *
 * @param props - Optional dashboard route content.
 * @returns Guarded dashboard layout.
 * @example
 * <DashboardLayout><Page /></DashboardLayout>
 */
const DashboardLayout = ({ children = null }: DashboardLayoutProps) => {
  const { user } = useUser();
  return (
    <DashboardGuard>
      {user ? <DashboardShell user={user}>{children}</DashboardShell> : null}
    </DashboardGuard>
  );
};

export default DashboardLayout;
