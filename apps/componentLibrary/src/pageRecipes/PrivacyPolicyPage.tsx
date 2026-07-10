'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

const companyProfile = {
  name: 'Example Company',
  supportEmail: 'support@example.com',
  optionalRegistrationId: 'Optional company registration ID',
  homeUrl: 'https://example.com',
  termsUrl: 'https://example.com/terms',
  privacyUrl: 'https://example.com/privacy',
} as const;

const LAST_UPDATED = 'July 1, 2026';

const googleDataItems = [
  'Your name, email address, and profile image from Google sign in.',
  'The date and time you sign in so the app can protect your account.',
  'Basic account activity needed to keep your session secure.',
] as const;

const policySections = [
  {
    id: 'collect',
    title: 'What we collect',
    copy: 'We collect the details you give us directly, account details from approved sign-in providers, and usage details needed to run and protect the app.',
  },
  {
    id: 'use',
    title: 'How we use data',
    copy: 'We use data to create your account, keep you signed in, provide the service, prevent abuse, respond to support requests, and improve reliability.',
  },
  {
    id: 'sharing',
    title: 'Sharing',
    copy: 'We do not sell personal data. We share data only with service providers that help us run the app, comply with the law, or protect users.',
  },
  {
    id: 'retention',
    title: 'Retention',
    copy: 'We keep account data while your account is active and for a limited period after deletion when required for security, billing, or legal reasons.',
  },
  {
    id: 'deletion',
    title: 'Deletion',
    copy: 'You can request account export or deletion by emailing the support address on this page. We will respond using the contact details tied to your account.',
  },
  {
    id: 'contact',
    title: 'Contact',
    copy: 'Privacy questions can be sent to the support email on this page. Include the email on your account so we can verify the request.',
  },
] as const;

/**
 * Polished privacy policy: TOC navigation, last-updated stamp, and acknowledgement UI.
 *
 * @returns The privacy policy recipe element.
 * @example
 * const element = <PrivacyPolicyPage />;
 */
export const PrivacyPolicyPage = () => {
  // TODO: Replace Example Company, support@example.com, and optional registration ID before publishing.
  // TODO: Confirm Google OAuth consent links point to the live privacy and terms pages.
  const ackId = useId();
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(policySections[0].id);
  const [notice, setNotice] = useState<string | null>(null);

  const confirmAck = () => {
    if (!acknowledged) {
      setNotice('Check the box to acknowledge the privacy policy first.');
      return;
    }
    setConfirmed(true);
    setNotice('Privacy policy acknowledged for this demo session.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 space-y-4">
          <Badge className="w-fit" variant="secondary">
            Legal
          </Badge>
          <div className="space-y-3">
            <h1 className="font-bold text-4xl tracking-tight md:text-5xl">Privacy policy</h1>
            <p className="max-w-3xl text-muted-foreground">
              {companyProfile.name} uses this page as the public privacy policy for the app,
              including the Google OAuth consent disclosure.
            </p>
            <p className="text-muted-foreground text-sm">
              Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
            </p>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-muted-foreground">Company</p>
              <p className="mt-1 font-medium">{companyProfile.name}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-muted-foreground">Support email</p>
              <a
                className="mt-1 block font-medium underline"
                href={`mailto:${companyProfile.supportEmail}`}
              >
                {companyProfile.supportEmail}
              </a>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-muted-foreground">Optional company ID</p>
              <p className="mt-1 font-medium">{companyProfile.optionalRegistrationId}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-start gap-3 text-sm" htmlFor={ackId}>
              <Checkbox
                checked={acknowledged}
                disabled={confirmed}
                id={ackId}
                onCheckedChange={(value) => setAcknowledged(value === true)}
              />
              <span>
                I have read this privacy policy.
                {confirmed ? (
                  <span className="mt-1 block text-emerald-700 text-xs">
                    Acknowledged on this device for the demo.
                  </span>
                ) : null}
              </span>
            </label>
            <Button disabled={confirmed} onClick={confirmAck} type="button">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              {confirmed ? 'Acknowledged' : 'Acknowledge'}
            </Button>
          </div>
        </header>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav
            aria-label="Privacy sections"
            className="h-fit rounded-lg border bg-card p-3 lg:sticky lg:top-4"
          >
            <p className="mb-2 font-medium text-xs text-muted-foreground">On this page</p>
            <ul className="space-y-1">
              <li>
                <button
                  className={cn(
                    'block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    activeSection === 'google'
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => {
                    setActiveSection('google');
                    document.getElementById('google')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  type="button"
                >
                  Google OAuth
                </button>
              </li>
              {policySections.map((section) => (
                <li key={section.id}>
                  <button
                    className={cn(
                      'block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      activeSection === section.id
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => {
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    type="button"
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4">
            <Card id="google">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">Google OAuth consent</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  This app asks Google only for profile information needed to create and protect a
                  user account. The public OAuth consent screen should point to this privacy policy
                  URL and to the terms page URL before production review.
                </p>
                <ul className="space-y-3">
                  {googleDataItems.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {policySections.map((section) => (
              <Card id={section.id} key={section.id}>
                <CardHeader>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">{section.copy}</CardContent>
              </Card>
            ))}

            <footer className="rounded-lg border bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Contact and policy links</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Home: {companyProfile.homeUrl} · Terms: {companyProfile.termsUrl} · Privacy:{' '}
                    {companyProfile.privacyUrl}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">Last updated {LAST_UPDATED}</p>
                </div>
                <a
                  className="inline-flex items-center gap-2 text-sm underline"
                  href={`mailto:${companyProfile.supportEmail}`}
                >
                  <Mail aria-hidden="true" className="h-4 w-4" />
                  {companyProfile.supportEmail}
                </a>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="Privacy motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
