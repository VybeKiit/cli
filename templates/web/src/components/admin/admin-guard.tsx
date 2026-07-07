'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/** Placeholder for actual role check — wire to @vybekiit/auth session */
const useIsAdmin = (): { isAdmin: boolean; isLoading: boolean } => {
  // TODO: Replace with real admin check from @vybekiit/auth
  // e.g. const { user } = useUser(); return user?.role === 'admin';
  return { isAdmin: true, isLoading: false };
};

interface AdminGuardProps {
  readonly children?: ReactNode;
  readonly fallback?: ReactNode;
}

/**
 * Protects admin routes. Redirects non-admin users to dashboard.
 * Wire `useIsAdmin()` to your actual role system (Supabase RLS, BetterAuth, etc.)
 *
 * @param props - Protected children and optional loading fallback.
 * @returns Protected content, a loading fallback, or `null` during redirect.
 * @example
 * <AdminGuard><AdminShell>...</AdminShell></AdminGuard>
 */
const AdminGuard = ({ children = null, fallback }: AdminGuardProps) => {
  const { isAdmin, isLoading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!(isLoading || isAdmin)) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return fallback === undefined ? <AdminLoadingSkeleton /> : fallback;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};

const AdminLoadingSkeleton = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export { AdminGuard };
