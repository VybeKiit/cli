import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { CheckCircle2, Download, FileText, Mail, ShieldCheck } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';

const companyProfile = {
  name: 'Example Company',
  supportEmail: 'support@example.com',
  optionalRegistrationId: 'Optional company registration ID',
  homeUrl: 'https://example.com',
  termsUrl: 'https://example.com/terms',
  privacyUrl: 'https://example.com/privacy',
} as const;

const termsSections = [
  {
    title: 'Accounts',
    copy: 'You are responsible for keeping your account details accurate and protecting access to your account. Contact support right away if you think your account was used without permission.',
  },
  {
    title: 'Acceptable use',
    copy: 'Do not use the app to break the law, harm others, overload the service, bypass security, scrape private data, or upload content you do not have permission to use.',
  },
  {
    title: 'Payments and plans',
    copy: 'If the app sells paid plans, billing details, refunds, renewals, and cancellations should match the active payment provider and the checkout copy shown to customers.',
  },
  {
    title: 'Changes and availability',
    copy: 'We may improve, change, pause, or end parts of the service. We will try to communicate material changes through the app or the support email on this page.',
  },
] as const;

/**
 * Render a source-backed terms of service page recipe.
 *
 * @returns A ready terms of service page component with Google OAuth link defaults.
 * @example
 * const element = <TermsOfServicePage />;
 */
export const TermsOfServicePage = () => {
  // TODO: Replace Example Company, support@example.com, and optional registration ID before publishing.
  // TODO: Confirm Google OAuth consent links point to the live privacy and terms pages.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl space-y-8">
        <header className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="space-y-4">
            <Badge className="w-fit" variant="secondary">
              Legal
            </Badge>
            <div className="space-y-3">
              <h1 className="font-bold text-4xl tracking-tight md:text-5xl">Terms of service</h1>
              <p className="max-w-3xl text-muted-foreground">
                These default terms give {companyProfile.name} a clear public terms page that can be
                linked from the Google OAuth consent screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DemoActionButton icon={<CheckCircle2 className="h-4 w-4" />}>
                Accept terms
              </DemoActionButton>
              <DemoActionButton icon={<Download className="h-4 w-4" />} variant="outline">
                Download copy
              </DemoActionButton>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle>Company details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{companyProfile.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Support email</p>
                <a className="font-medium underline" href={`mailto:${companyProfile.supportEmail}`}>
                  {companyProfile.supportEmail}
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Optional company ID</p>
                <p className="font-medium">{companyProfile.optionalRegistrationId}</p>
              </div>
            </CardContent>
          </Card>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle>Google OAuth consent</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Keep this page public and link it beside the privacy policy in the OAuth consent
              setup. The app name, homepage, support email, privacy URL, and terms URL should match
              the brand shown to users.
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {[companyProfile.homeUrl, companyProfile.privacyUrl, companyProfile.termsUrl].map(
                (url) => (
                  <div className="rounded-md border px-3 py-2" key={url}>
                    {url}
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {termsSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{section.copy}</CardContent>
            </Card>
          ))}
        </div>

        <footer className="rounded-lg border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Have a qualified legal reviewer approve this before launch.
            </p>
            <a
              className="inline-flex items-center gap-2 text-sm underline"
              href={`mailto:${companyProfile.supportEmail}`}
            >
              <Mail className="h-4 w-4" />
              {companyProfile.supportEmail}
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
};
