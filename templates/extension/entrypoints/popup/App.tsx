import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import { getActiveLocale, localeToDirection, t } from '@/lib/i18n';

const appUrl = import.meta.env.WXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Popup UI — shadcn subset wired to the builder's web backend URL. */
export default function App() {
  const dir = localeToDirection(getActiveLocale());

  return (
    <main className="w-80 bg-background p-4 text-foreground" dir={dir}>
      <ReportModeDev />
      <Card>
        <CardHeader>
          <CardTitle>{t('popup.title')}</CardTitle>
          <CardDescription>{t('popup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert>
            <AlertDescription>{t('popup.backend', appUrl)}</AlertDescription>
          </Alert>
          <Button asChild={true}>
            <a href={appUrl} target="_blank" rel="noreferrer">
              {t('popup.openWebApp')}
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
