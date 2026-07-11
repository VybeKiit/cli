'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader } from '@vybekiit/ui/card';
import { Empty, EmptyDescription, EmptyHeader } from '@vybekiit/ui/empty';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { RadioGroup, RadioGroupItem } from '@vybekiit/ui/radio-group';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Separator } from '@vybekiit/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  PartyPopper,
  Plus,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { Stepper } from './Stepper';
import { SummaryRow } from './SummaryRow';
import { STEPS, TOTAL_STEPS } from './steps';

type TeamSize = 'solo' | 'small' | 'large';
type ProductType = 'saas' | 'store' | 'community';
type AccentId = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';
type Status = 'editing' | 'provisioning' | 'done';

const TEAM_SIZES: readonly { readonly id: TeamSize; readonly label: string }[] = [
  { id: 'solo', label: 'Just me' },
  { id: 'small', label: '2–10' },
  { id: 'large', label: '11+' },
];

const PRODUCT_TYPES: readonly {
  readonly id: ProductType;
  readonly label: string;
  readonly hint: string;
}[] = [
  { id: 'saas', label: 'SaaS app', hint: 'Subscriptions and dashboards' },
  { id: 'store', label: 'Online store', hint: 'One-off product sales' },
  { id: 'community', label: 'Community', hint: 'Members and content' },
];

const ACCENTS: readonly {
  readonly id: AccentId;
  readonly label: string;
  readonly swatch: string;
}[] = [
  { id: 'violet', label: 'Violet', swatch: 'bg-violet-500' },
  { id: 'blue', label: 'Blue', swatch: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber', swatch: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', swatch: 'bg-rose-500' },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const teamSizeLabel = (id: TeamSize): string =>
  TEAM_SIZES.find((option) => option.id === id)?.label ?? id;

const productTypeLabel = (id: ProductType): string =>
  PRODUCT_TYPES.find((option) => option.id === id)?.label ?? id;

const accentLabel = (id: AccentId): string =>
  ACCENTS.find((option) => option.id === id)?.label ?? id;

/**
 * A production-shaped first-run onboarding wizard: a four-step flow (workspace, brand, team, review)
 * with a live-derived URL slug, gated navigation, real email-invite chips with validation, and a
 * provisioning → done sequence. Every state is reachable by interacting — invalid fields block Next,
 * bad emails show an inline error, and Finish provisions then confirms. Fully interactive with local
 * state; see the "Plug this into your app" panel for the real persistence + invite wiring.
 *
 * @returns The onboarding recipe element.
 * @example
 * const element = <OnboardingPage />;
 */
export const OnboardingPage = () => {
  const appNameId = useId();
  const appNameErrorId = useId();
  const slugId = useId();
  const slugErrorId = useId();
  const emailId = useId();
  const emailErrorId = useId();
  const teamSizeLabelId = useId();
  const liveId = useId();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);
  const mountedRef = useRef(false);

  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [teamSize, setTeamSize] = useState<TeamSize>('small');
  const [accent, setAccent] = useState<AccentId>('violet');
  const [productType, setProductType] = useState<ProductType>('saas');
  const [emails, setEmails] = useState<readonly string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [touchedStep1, setTouchedStep1] = useState(false);
  const [status, setStatus] = useState<Status>('editing');

  const appNameValid = appName.trim().length >= 2;
  const slugValid = SLUG_PATTERN.test(slug);
  const step1Valid = appNameValid && slugValid;
  const activeStep = STEPS.find((entry) => entry.id === step) ?? STEPS[0];
  const isProvisioning = status === 'provisioning';

  // Move focus to the step heading on each step change (but not on the first mount).
  // biome-ignore lint/correctness/useExhaustiveDependencies: step is the intended trigger.
  useEffect(() => {
    if (mountedRef.current) {
      stepHeadingRef.current?.focus();
    } else {
      mountedRef.current = true;
    }
  }, [step]);

  // Move focus to the confirmation heading once provisioning completes.
  useEffect(() => {
    if (status === 'done') {
      doneHeadingRef.current?.focus();
    }
  }, [status]);

  const changeAppName = (value: string) => {
    setAppName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  };

  const changeSlug = (value: string) => {
    setSlugEdited(true);
    setSlug(slugify(value));
  };

  const addEmail = () => {
    const value = emailInput.trim().toLowerCase();
    if (value.length === 0) {
      return;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (emails.includes(value)) {
      setEmailError('That teammate is already on the list.');
      return;
    }
    setEmails((current) => [...current, value]);
    setEmailInput('');
    setEmailError(null);
  };

  const removeEmail = (value: string) => {
    setEmails((current) => current.filter((entry) => entry !== value));
  };

  const goNext = () => {
    if (step === 1) {
      setTouchedStep1(true);
      if (!step1Valid) {
        return;
      }
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const goBack = () => setStep((current) => Math.max(1, current - 1));

  const finish = (event: FormEvent) => {
    event.preventDefault();
    setStatus('provisioning');
    // Simulated provisioning. Real apps POST the collected setup and await the created workspace.
    globalThis.setTimeout(() => setStatus('done'), 1600);
  };

  const restart = () => {
    setStep(1);
    setAppName('');
    setSlug('');
    setSlugEdited(false);
    setTeamSize('small');
    setAccent('violet');
    setProductType('saas');
    setEmails([]);
    setEmailInput('');
    setEmailError(null);
    setTouchedStep1(false);
    setStatus('editing');
  };

  const displaySlug = slug.length > 0 ? slug : 'your-app';

  // ---------- done ----------
  if (status === 'done') {
    return (
      <DemoRecipeFrame defaultTransition="slide" title="Onboarding motion pass">
        <main className="mx-auto max-w-xl px-4 py-16">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <PartyPopper aria-hidden="true" className="h-8 w-8" />
            </span>
            <h1
              className="mt-6 font-bold text-3xl tracking-tight outline-none md:text-4xl"
              ref={doneHeadingRef}
              tabIndex={-1}
            >
              You're all set{appName.trim().length > 0 ? `, ${appName.trim()}` : ''}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your workspace is live at{' '}
              <span className="font-medium text-foreground">vybekiit.app/{displaySlug}</span>.
            </p>
          </div>
          <Card className="mt-8 text-left">
            <CardContent className="space-y-3 pt-6">
              {[
                `Workspace “${appName.trim() || 'Untitled'}” created at vybekiit.app/${displaySlug}`,
                `${accentLabel(accent)} theme applied across the app`,
                emails.length > 0
                  ? `${emails.length} teammate invite${emails.length === 1 ? '' : 's'} sent`
                  : 'No invites yet — add teammates anytime from Settings',
                'Your GitHub account was invited to the starter repos',
              ].map((line) => (
                <p className="flex items-start gap-2 text-sm" key={line}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  />
                  <span>{line}</span>
                </p>
              ))}
            </CardContent>
          </Card>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button">
              <Rocket aria-hidden="true" className="h-4 w-4" /> Go to dashboard
            </Button>
            <Button onClick={restart} type="button" variant="outline">
              Start over
            </Button>
          </div>
        </main>
      </DemoRecipeFrame>
    );
  }

  // ---------- editing (wizard) ----------
  return (
    <DemoRecipeFrame defaultTransition="slide" title="Onboarding motion pass">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 space-y-2">
          <Badge className="w-fit" variant="secondary">
            <Sparkles aria-hidden="true" className="h-3 w-3" /> Get started
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Set up your app</h1>
        </div>

        <p aria-live="polite" className="sr-only" id={liveId}>
          Step {step} of {TOTAL_STEPS}: {activeStep.title}. {activeStep.hint}
        </p>

        <Card>
          <CardHeader>
            <Stepper current={step} />
          </CardHeader>
          <CardContent>
            <h2 className="font-semibold text-xl outline-none" ref={stepHeadingRef} tabIndex={-1}>
              {activeStep.title}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">{activeStep.hint}</p>

            <form className="mt-6" noValidate={true} onSubmit={finish}>
              {/* step 1: workspace */}
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor={appNameId}>App name</Label>
                    <Input
                      aria-describedby={touchedStep1 && !appNameValid ? appNameErrorId : undefined}
                      aria-invalid={touchedStep1 && !appNameValid}
                      id={appNameId}
                      onChange={(event) => changeAppName(event.target.value)}
                      placeholder="Acme Analytics"
                      value={appName}
                    />
                    {touchedStep1 && !appNameValid ? (
                      <p className="text-destructive text-sm" id={appNameErrorId}>
                        Give your app a name of at least 2 characters.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={slugId}>Workspace URL</Label>
                    <div className="flex items-center rounded-md border pl-3 focus-within:ring-1 focus-within:ring-ring">
                      <span className="text-muted-foreground text-sm">vybekiit.app/</span>
                      <Input
                        aria-describedby={touchedStep1 && !slugValid ? slugErrorId : undefined}
                        aria-invalid={touchedStep1 && !slugValid}
                        className="border-0 focus-visible:ring-0"
                        id={slugId}
                        onChange={(event) => changeSlug(event.target.value)}
                        placeholder="acme-analytics"
                        value={slug}
                      />
                    </div>
                    {touchedStep1 && !slugValid ? (
                      <p className="text-destructive text-sm" id={slugErrorId}>
                        Use lowercase letters, numbers, and single hyphens.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium text-sm" id={teamSizeLabelId}>
                      Team size
                    </span>
                    <SegmentedControl
                      aria-labelledby={teamSizeLabelId}
                      className="w-full"
                      onValueChange={(value) => setTeamSize(value as TeamSize)}
                      value={teamSize}
                    >
                      {TEAM_SIZES.map((option) => (
                        <SegmentedControlItem className="flex-1" key={option.id} value={option.id}>
                          {option.label}
                        </SegmentedControlItem>
                      ))}
                    </SegmentedControl>
                  </div>
                </div>
              ) : null}

              {/* step 2: brand */}
              {step === 2 ? (
                <div className="space-y-6">
                  <fieldset className="space-y-3">
                    <legend className="font-medium text-sm">Accent color</legend>
                    <RadioGroup
                      className="flex flex-wrap gap-3"
                      onValueChange={(value) => setAccent(value as AccentId)}
                      value={accent}
                    >
                      {ACCENTS.map((option) => (
                        <Label
                          className="flex cursor-pointer flex-col items-center gap-1.5"
                          htmlFor={`accent-${option.id}`}
                          key={option.id}
                        >
                          <span
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-all',
                              option.swatch,
                              accent === option.id ? 'ring-2 ring-ring' : '',
                            )}
                          >
                            {accent === option.id ? (
                              <Check aria-hidden="true" className="h-5 w-5 text-white" />
                            ) : null}
                          </span>
                          <span className="text-muted-foreground text-xs">{option.label}</span>
                          <RadioGroupItem
                            className="sr-only"
                            id={`accent-${option.id}`}
                            value={option.id}
                          />
                        </Label>
                      ))}
                    </RadioGroup>
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="font-medium text-sm">What are you building?</legend>
                    <RadioGroup
                      className="gap-2"
                      onValueChange={(value) => setProductType(value as ProductType)}
                      value={productType}
                    >
                      {PRODUCT_TYPES.map((option) => (
                        <Label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                            productType === option.id ? 'border-primary bg-primary/5' : '',
                          )}
                          htmlFor={`product-${option.id}`}
                          key={option.id}
                        >
                          <RadioGroupItem id={`product-${option.id}`} value={option.id} />
                          <span>
                            <span className="font-medium">{option.label}</span>
                            <span className="block text-muted-foreground text-xs">
                              {option.hint}
                            </span>
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </fieldset>
                </div>
              ) : null}

              {/* step 3: team */}
              {step === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={emailId}>Invite teammates by email</Label>
                    <div className="flex gap-2">
                      <div className="flex flex-1 items-center rounded-md border pl-3 focus-within:ring-1 focus-within:ring-ring">
                        <Mail aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        <Input
                          aria-describedby={emailError ? emailErrorId : undefined}
                          aria-invalid={emailError !== null}
                          className="border-0 focus-visible:ring-0"
                          id={emailId}
                          onChange={(event) => {
                            setEmailInput(event.target.value);
                            setEmailError(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addEmail();
                            }
                          }}
                          placeholder="teammate@company.com"
                          type="email"
                          value={emailInput}
                        />
                      </div>
                      <Button onClick={addEmail} type="button" variant="outline">
                        <Plus aria-hidden="true" className="h-4 w-4" /> Add
                      </Button>
                    </div>
                    {emailError ? (
                      <p className="text-destructive text-sm" id={emailErrorId} role="alert">
                        {emailError}
                      </p>
                    ) : null}
                  </div>

                  {emails.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {emails.map((entry) => (
                        <li
                          className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-sm"
                          key={entry}
                        >
                          <span>{entry}</span>
                          <button
                            aria-label={`Remove ${entry}`}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => removeEmail(entry)}
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty className="p-4" variant="compact">
                      <EmptyHeader>
                        <EmptyDescription>
                          No invites yet. Add a few, or skip and invite people later.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </div>
              ) : null}

              {/* step 4: review */}
              {step === 4 ? (
                <dl className="space-y-3 text-sm">
                  <SummaryRow label="App name" value={appName.trim() || '—'} />
                  <SummaryRow label="Workspace URL" value={`vybekiit.app/${displaySlug}`} />
                  <SummaryRow label="Team size" value={teamSizeLabel(teamSize)} />
                  <SummaryRow label="Accent" value={accentLabel(accent)} />
                  <SummaryRow label="Building" value={productTypeLabel(productType)} />
                  <SummaryRow
                    label="Invites"
                    value={emails.length > 0 ? emails.join(', ') : 'None yet'}
                  />
                </dl>
              ) : null}

              {/* nav */}
              <Separator className="my-6" />
              <div className="flex items-center justify-between gap-3">
                <Button
                  disabled={step === 1 || isProvisioning}
                  onClick={goBack}
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
                </Button>
                {step < TOTAL_STEPS ? (
                  <Button onClick={goNext} type="button">
                    Continue <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button aria-busy={isProvisioning} disabled={isProvisioning} type="submit">
                    {isProvisioning ? (
                      <>
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Setting
                        things up…
                      </>
                    ) : (
                      <>
                        <Check aria-hidden="true" className="h-4 w-4" /> Finish setup
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* real integration contract — the point that makes this plug-and-play */}
        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — the slug derives from the name live, Next is gated
            on validation, and invites validate before they're added. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Persist each step (or the whole payload on Finish) with{' '}
              <code>POST /api/onboarding</code> writing to your DB / D1; check the <code>slug</code>{' '}
              is free before you commit it.
            </li>
            <li>
              On <b>Finish</b>, provision the workspace, save the <code>accent</code> and{' '}
              <code>productType</code> to the user's settings, and set{' '}
              <code>onboardingComplete</code> so your app routes past this page next time.
            </li>
            <li>
              Send the <code>emails</code> through your invite flow (the same GitHub gate the
              checkout webhook uses can add them to your repos).
            </li>
            <li>
              Swap the <code>setTimeout</code> in <code>finish</code> for the real request and keep
              the <code>provisioning</code> → <code>done</code> states as-is.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
