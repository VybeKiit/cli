'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/billing', label: 'Billing', icon: '💳' },
  { href: '/admin/teams', label: 'Teams', icon: '🏢' },
] as const;
// strips locale prefixes like "/en" and "/en-US" before admin nav matching
const LOCALE_PREFIX_PATTERN = /^\/[a-z]{2}(-[A-Z]{2})?/;

interface AdminShellProps {
  readonly children?: ReactNode;
}

/**
 * Render the admin sidebar and content shell.
 *
 * @param props - Admin page content.
 * @returns A two-column admin layout with active navigation.
 * @example
 * <AdminShell><AdminDashboard /></AdminShell>
 */
export const AdminShell = ({ children = null }: AdminShellProps) => {
  const pathname = usePathname();
  // Strip locale prefix for path matching
  const path = pathname.replace(LOCALE_PREFIX_PATTERN, '');

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="font-semibold text-lg">Admin Panel</h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              path === item.href || (item.href !== '/admin' && path.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
