'use client';

import { DashboardGuard } from '@/components/dashboard-guard';
import { DashboardShell } from '@/components/dashboard-shell';
import { useUser } from '@/hooks/use-user';
import type { ReactNode } from 'react';

/** Protects dashboard routes and wraps them in signed-in chrome. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useUser();
  return (
    <DashboardGuard>
      {user ? <DashboardShell user={user}>{children}</DashboardShell> : null}
    </DashboardGuard>
  );
}
