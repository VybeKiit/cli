import type { ReactNode } from 'react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminShell } from '@/components/admin/admin-shell';

interface AdminLayoutProps {
  readonly children?: ReactNode;
}

/**
 * Guard admin routes and wrap them in admin chrome.
 *
 * @param props - Optional admin route content.
 * @returns Guarded admin layout.
 * @example
 * <AdminLayout><AdminPage /></AdminLayout>
 */
const AdminLayout = ({ children = null }: AdminLayoutProps) => (
  <AdminGuard>
    <AdminShell>{children}</AdminShell>
  </AdminGuard>
);

export default AdminLayout;
