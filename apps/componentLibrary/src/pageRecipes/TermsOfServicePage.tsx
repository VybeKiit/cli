'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { CheckCircle2, Download, FileText, Mail, ShieldCheck } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

const companyProfile = {
  name: 'Example Company',
  supportEmail: 'support@example.com',
  optionalRegistrationId: 'Optional company registration ID',
  homeUrl: 'https://example.com',
  termsUrl: 'https://example.com/terms',
  privacyUrl: 'https://example.com/privacy',
} as const;

const LAST_UPDATED = 'July 1, 2026';

const termsSections = [
  {
    id: 'accounts',
    title: 'Accounts',
    copy: 'You are responsible for keeping your account details accurate and protecting access to your account. Contact support right away if you think your account was used without permission.',
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    copy: 'Do not use the app to break the law, harm others, overload the service, bypass security, scrape private data, or upload content you do not have permission to use.',
  },
  {
    id: 'payments',
    title: 'Payments and plans',
    copy: 'If the app sells paid plans, billing details, refunds, renewals, and cancellations should match the active payment provider and the checkout copy shown to customers.',
  },
  {
    id: 'changes',
    title: 'Changes and availability',
    copy: 'We may improve, change, pause, or end parts of the service. We will try to communicate material changes through the app or the support email on this page.',
  },
  {
    id: 'liability',
    title: 'Liability',
    copy: 'The service is provided as-is within the limits allowed by law. Nothing in these terms removes rights you have as a consumer under the law of your country.',
  },
  {
    id: 'contact',
    title: 'Contact',
    copy: 'Questions about these terms can be sent to the support email listed on this page. We will respond using the contact details tied to your account when possible.',
  },
] as const;

/**
 * Polished terms of service: TOC navigation, last-updated stamp, and acceptance UI.
 *
 * @returns The terms of service recipe element.
 * @example
 * const element = <TermsOfServicePage />;
 */
export const TermsOfServicePage = () => {
  // TODO: Replace Example Company, support@example.com, and optional registration ID before publishing.
  // TODO: Confirm Google OAuth consent links point to the live privacy and terms pages.
  const acceptId = useId();
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(termsSections[0].id);
  const [notice, setNotice] = useState<string | null>(null);

  const acceptTerms = () => {
    if (!accepted) {
      setNotice('Check the box to accept the terms first.');
      return;
    }
    setConfirmed(true);
    setNotice('Terms accepted for this demo session.');
  };

  const downloadCopy = () => {
    setNotice('Download is a demo action — wire a PDF or markdown export in production.');
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Terms motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
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
              <p className="text-muted-foreground text-sm">
                Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={confirmed} onClick={acceptTerms} type="button">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                {confirmed ? 'Accepted' : 'Accept terms'}
              </Button>
              <Button onClick={downloadCopy} type="button" variant="outline">
                <Download aria-hidden="true" className="h-4 w-4" /> Download copy
              </Button>
            </div>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm',
                confirmed && 'border-emerald-500/40 bg-emerald-500/5',
              )}
              htmlFor={acceptId}
            >
              <Checkbox
                checked={accepted}
                disabled={confirmed}
                id={acceptId}
                onCheckedChange={(value) => setAccepted(value === true)}
              />
              <span>
                I have read these terms and agree on behalf of myself or my organization.
                {confirmed ? (
                  <span className="mt-1 block text-emerald-700 text-xs">
                    Accepted on this device for the demo.
                  </span>
                ) : null}
              </span>
            </label>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText aria-hidden="true" className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Company details</CardTitle>
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

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav
            aria-label="Terms sections"
            className="h-fit rounded-lg border bg-card p-3 lg:sticky lg:top-4"
          >
            <p className="mb-2 font-medium text-muted-foreground text-xs">On this page</p>
            <ul className="space-y-1">
              {termsSections.map((section) => (
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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">Google OAuth consent</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Keep this page public and link it beside the privacy policy in the OAuth consent
                  setup. The app name, homepage, support email, privacy URL, and terms URL should
                  match the brand shown to users.
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  {[companyProfile.homeUrl, companyProfile.privacyUrl, companyProfile.termsUrl].map(
                    (url) => (
                      <div className="break-all rounded-md border px-3 py-2 text-xs" key={url}>
                        {url}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {termsSections.map((section) => (
              <Card id={section.id} key={section.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">{section.copy}</CardContent>
              </Card>
            ))}

            <footer className="rounded-lg border bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Have a qualified legal reviewer approve this before launch. Last updated{' '}
                  {LAST_UPDATED}.
                </p>
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
    </DemoRecipeFrame>
  );
};

/** Gallery theme + motion wrapper. */
