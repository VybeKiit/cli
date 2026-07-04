'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/useUser';
import { useRouter } from '@/i18n/navigation';
import { type ReactNode, useEffect } from 'react';

/** Skeleton shown while the session check runs. */
export function DashboardLoadingSkeleton() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </main>
  );
}

/**
 * Client route guard for `/dashboard/*` — redirects signed-out visitors to `/login`.
 * Renders nothing while redirecting so the flash is minimal.
 */
export function DashboardGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!(loading || user)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <DashboardLoadingSkeleton />;
  if (!user) return null;
  return children;
}
