'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/** Placeholder for actual role check — wire to @vybekiit/auth session */
function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  // TODO: Replace with real admin check from @vybekiit/auth
  // e.g. const { user } = useUser(); return user?.role === 'admin';
  return { isAdmin: true, isLoading: false };
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Protects admin routes. Redirects non-admin users to dashboard.
 * Wire `useIsAdmin()` to your actual role system (Supabase RLS, BetterAuth, etc.)
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, isLoading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!(isLoading || isAdmin)) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return fallback ?? <AdminLoadingSkeleton />;
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}

function AdminLoadingSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
