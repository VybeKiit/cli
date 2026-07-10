import { DashboardHomePage } from '@/components/saas/dashboardHome';
import { setRequestLocale } from 'next-intl/server';

interface DashboardPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

/**
 * Render the signed-in dashboard home.
 *
 * @param props - Locale route params from Next.js.
 * @returns The interactive dashboard overview page.
 * @example
 * <DashboardPage params={params} />
 */
const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardHomePage />;
};

export default DashboardPage;
