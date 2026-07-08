import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';

const companyProfile = {
  name: 'Example Company',
  supportEmail: 'support@example.com',
  optionalRegistrationId: 'Optional company registration ID',
  homeUrl: 'https://example.com',
  termsUrl: 'https://example.com/terms',
  privacyUrl: 'https://example.com/privacy',
} as const;

const googleDataItems = [
  'Your name, email address, and profile image from Google sign in.',
  'The date and time you sign in so the app can protect your account.',
  'Basic account activity needed to keep your session secure.',
] as const;

const policySections = [
  {
    title: 'What we collect',
    copy: 'We collect the details you give us directly, account details from approved sign-in providers, and usage details needed to run and protect the app.',
  },
  {
    title: 'How we use data',
    copy: 'We use data to create your account, keep you signed in, provide the service, prevent abuse, respond to support requests, and improve reliability.',
  },
  {
    title: 'Sharing',
    copy: 'We do not sell personal data. We share data only with service providers that help us run the app, comply with the law, or protect users.',
  },
  {
    title: 'Deletion',
    copy: 'You can request account export or deletion by emailing the support address on this page. We will respond using the contact details tied to your account.',
  },
] as const;

/**
 * Render a source-backed privacy policy page recipe.
 *
 * @returns A ready privacy policy page component with Google OAuth disclosure defaults.
 * @example
 * const element = <PrivacyPolicyPage />;
 */
export const PrivacyPolicyPage = () => {
  // TODO: Replace Example Company, support@example.com, and optional registration ID before publishing.
  // TODO: Confirm Google OAuth consent links point to the live privacy and terms pages.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-4">
          <Badge className="w-fit" variant="secondary">
            Legal
          </Badge>
          <div className="space-y-3">
            <h1 className="font-bold text-4xl tracking-tight md:text-5xl">Privacy policy</h1>
            <p className="max-w-3xl text-muted-foreground">
              {companyProfile.name} uses this page as the public privacy policy for the app,
              including the Google OAuth consent disclosure.
            </p>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-muted-foreground">Company</p>
              <p className="mt-1 font-medium">{companyProfile.name}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-muted-foreground">Support email</p>
              <a className="mt-1 block font-medium" href={`mailto:${companyProfile.supportEmail}`}>
                {companyProfile.supportEmail}
              </a>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-muted-foreground">Optional company ID</p>
              <p className="mt-1 font-medium">{companyProfile.optionalRegistrationId}</p>
            </div>
          </div>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle>Google OAuth consent</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              This app asks Google only for profile information needed to create and protect a user
              account. The public OAuth consent screen should point to this privacy policy URL and
              to the terms page URL before production review.
            </p>
            <ul className="space-y-3">
              {googleDataItems.map((item) => (
                <li className="flex gap-2" key={item}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {policySections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{section.copy}</CardContent>
            </Card>
          ))}
        </div>

        <footer className="rounded-lg border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Contact and policy links</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Home: {companyProfile.homeUrl} · Terms: {companyProfile.termsUrl} · Privacy:{' '}
                {companyProfile.privacyUrl}
              </p>
            </div>
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
