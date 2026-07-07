import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vybekiit/ui/tabs';
import { DASHBOARD_STATS, GETTING_STARTED_STEP_KEYS } from '@/data/dashboard';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Signed-in dashboard — stats, getting-started list, and tabbed sections.
 * Route protection and signed-in chrome live in `app/[locale]/dashboard/layout.tsx`.
 *
 * @param props - Locale route params from Next.js.
 * @returns The localized signed-in dashboard page.
 * @example
 * <DashboardPage params={params} />
 */
const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary">{t('dashboard.badge')}</Badge>
        <h1 className="font-bold text-3xl tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('dashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="next">{t('dashboard.tabs.nextSteps')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="flex flex-col gap-6 pt-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {DASHBOARD_STATS.map((stat) => (
              <Card key={stat.labelKey}>
                <CardHeader>
                  <CardDescription>{t(stat.labelKey)}</CardDescription>
                  <CardTitle className="text-3xl">{t(stat.valueKey)}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="next" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.gettingStarted.title')}</CardTitle>
              <CardDescription>{t('dashboard.gettingStarted.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
                {GETTING_STARTED_STEP_KEYS.map((stepKey) => (
                  <li key={stepKey}>{t(stepKey)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default DashboardPage;
