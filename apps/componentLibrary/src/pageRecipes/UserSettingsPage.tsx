'use client';

import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { Avatar, AvatarFallback } from '@vybekiit/ui/avatar';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { RadioGroup, RadioGroupItem } from '@vybekiit/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Separator } from '@vybekiit/ui/separator';
import { Switch } from '@vybekiit/ui/switch';
import { Textarea } from '@vybekiit/ui/textarea';
import {
  AtSign,
  Bell,
  CheckCircle2,
  Loader2,
  Mail,
  Palette,
  Save,
  Undo2,
  User,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type ThemePref = 'system' | 'light' | 'dark';
type NotificationKey = 'productUpdates' | 'billingReceipts' | 'securityAlerts' | 'weeklyDigest';
type SaveStatus = 'idle' | 'saving' | 'saved';

/** The full settings payload. One object so a change is one shallow diff away from the saved baseline. */
type SettingsForm = {
  readonly fullName: string;
  readonly username: string;
  readonly email: string;
  readonly bio: string;
  readonly timezone: string;
  readonly theme: ThemePref;
  readonly notifications: Readonly<Record<NotificationKey, boolean>>;
};

const BIO_MAX = 160;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The account as last saved on the server — the recipe starts already populated, like a real app. */
const INITIAL_FORM: SettingsForm = {
  fullName: 'Maya Chen',
  username: 'mayac',
  email: 'maya@vybekiit.app',
  bio: 'Founder building analytics tools. Coffee, dogs, and clean dashboards.',
  timezone: 'America/Los_Angeles',
  theme: 'system',
  notifications: {
    productUpdates: true,
    billingReceipts: true,
    securityAlerts: true,
    weeklyDigest: false,
  },
};

const TIMEZONES: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'America/Los_Angeles', label: 'Pacific — Los Angeles' },
  { id: 'America/New_York', label: 'Eastern — New York' },
  { id: 'Europe/London', label: 'GMT — London' },
  { id: 'Europe/Berlin', label: 'CET — Berlin' },
  { id: 'Asia/Singapore', label: 'SGT — Singapore' },
  { id: 'Asia/Tokyo', label: 'JST — Tokyo' },
];

const THEMES: readonly { readonly id: ThemePref; readonly label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const NOTIFICATIONS: readonly {
  readonly key: NotificationKey;
  readonly title: string;
  readonly detail: string;
}[] = [
  { key: 'productUpdates', title: 'Product updates', detail: 'New features and improvements.' },
  {
    key: 'billingReceipts',
    title: 'Billing receipts',
    detail: 'Invoices and payment confirmations.',
  },
  { key: 'securityAlerts', title: 'Security alerts', detail: 'New sign-ins and password changes.' },
  { key: 'weeklyDigest', title: 'Weekly digest', detail: 'A Monday summary of your metrics.' },
];

const initials = (name: string): string => {
  const letters = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
  return letters.length > 0 ? letters : 'VK';
};

/**
 * A production-shaped account settings page: a populated profile form (with a live avatar and bio
 * counter), theme and notification preferences on real primitives, and a dirty-state save bar that
 * only appears once something changes. Every state is reachable — editing reveals the save bar, an
 * invalid email blocks Save with an inline error, and Save runs a saving → saved sequence. Fully
 * interactive with local state; see the "Plug this into your app" panel for the real save wiring.
 *
 * @returns The user settings recipe element.
 * @example
 * const element = <UserSettingsPage />;
 */
export const UserSettingsPage = () => {
  const fullNameId = useId();
  const usernameId = useId();
  const emailId = useId();
  const emailErrorId = useId();
  const bioId = useId();
  const bioCountId = useId();
  const timezoneId = useId();
  const themeLabelId = useId();
  const notifyPrefix = useId();

  const [saved, setSaved] = useState<SettingsForm>(INITIAL_FORM);
  const [form, setForm] = useState<SettingsForm>(INITIAL_FORM);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [emailTouched, setEmailTouched] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const emailValid = EMAIL_PATTERN.test(form.email);
  const showEmailError = emailTouched && !emailValid;

  let liveText = '';
  if (dirty) {
    liveText = 'You have unsaved changes.';
  } else if (status === 'saved') {
    liveText = 'Settings saved.';
  }

  const update = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus((current) => (current === 'saving' ? current : 'idle'));
  };

  const toggleNotification = (key: NotificationKey) => {
    setForm((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: !current.notifications[key] },
    }));
    setStatus((current) => (current === 'saving' ? current : 'idle'));
  };

  const discard = () => {
    setForm(saved);
    setStatus('idle');
    setEmailTouched(false);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailValid) {
      return;
    }
    setStatus('saving');
    // Simulated persistence. Real apps PATCH /api/settings and adopt the server's echoed record.
    globalThis.setTimeout(() => {
      setSaved(form);
      setStatus('saved');
    }, 1200);
  };

  const isSaving = status === 'saving';

  return (
    <Frame>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 space-y-1">
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, preferences, and notifications. Change anything to reveal the save
            bar.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {liveText}
        </p>

        <form className="space-y-6" noValidate={true} onSubmit={save}>
          {status === 'saved' && !dirty ? (
            <Alert>
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              <AlertTitle>Settings saved</AlertTitle>
              <AlertDescription>Your changes are live.</AlertDescription>
            </Alert>
          ) : null}

          {/* profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User aria-hidden="true" className="h-4 w-4" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="font-semibold text-lg">
                    {initials(form.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{form.fullName || 'Your name'}</p>
                  <p className="truncate text-muted-foreground text-sm">
                    @{form.username || 'username'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={fullNameId}>Full name</Label>
                  <Input
                    id={fullNameId}
                    onChange={(event) => update('fullName', event.target.value)}
                    value={form.fullName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={usernameId}>Username</Label>
                  <div className="flex items-center rounded-md border pl-3 focus-within:ring-1 focus-within:ring-ring">
                    <AtSign aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                    <Input
                      className="border-0 focus-visible:ring-0"
                      id={usernameId}
                      onChange={(event) =>
                        update('username', event.target.value.replace(/\s+/g, ''))
                      }
                      value={form.username}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={emailId}>Contact email</Label>
                <div className="flex items-center rounded-md border pl-3 focus-within:ring-1 focus-within:ring-ring">
                  <Mail aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-describedby={showEmailError ? emailErrorId : undefined}
                    aria-invalid={showEmailError}
                    className="border-0 focus-visible:ring-0"
                    id={emailId}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(event) => update('email', event.target.value)}
                    type="email"
                    value={form.email}
                  />
                </div>
                {showEmailError ? (
                  <p className="text-destructive text-sm" id={emailErrorId}>
                    Enter a valid email address.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={bioId}>Bio</Label>
                  <span className="text-muted-foreground text-xs tabular-nums" id={bioCountId}>
                    {form.bio.length}/{BIO_MAX}
                  </span>
                </div>
                <Textarea
                  aria-describedby={bioCountId}
                  id={bioId}
                  maxLength={BIO_MAX}
                  onChange={(event) => update('bio', event.target.value)}
                  rows={3}
                  value={form.bio}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={timezoneId}>Timezone</Label>
                <Select onValueChange={(value) => update('timezone', value)} value={form.timezone}>
                  <SelectTrigger id={timezoneId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base" id={themeLabelId}>
                <Palette aria-hidden="true" className="h-4 w-4" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                aria-labelledby={themeLabelId}
                className="flex gap-1 rounded-lg border bg-muted p-1"
                onValueChange={(value) => update('theme', value as ThemePref)}
                value={form.theme}
              >
                {THEMES.map((option) => (
                  <Label
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center rounded-md px-3 py-1.5 font-medium text-sm transition-colors',
                      form.theme === option.id
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground',
                    )}
                    htmlFor={`${themeLabelId}-${option.id}`}
                    key={option.id}
                  >
                    <RadioGroupItem
                      className="sr-only"
                      id={`${themeLabelId}-${option.id}`}
                      value={option.id}
                    />
                    {option.label}
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell aria-hidden="true" className="h-4 w-4" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {NOTIFICATIONS.map((item) => {
                const rowId = `${notifyPrefix}-${item.key}`;
                return (
                  <div
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    key={item.key}
                  >
                    <Label className="cursor-pointer" htmlFor={rowId}>
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className="block text-muted-foreground text-xs">{item.detail}</span>
                    </Label>
                    <Switch
                      checked={form.notifications[item.key]}
                      id={rowId}
                      onCheckedChange={() => toggleNotification(item.key)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* dirty-state save bar */}
          {dirty ? (
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-lg">
              <span className="text-muted-foreground text-sm">You have unsaved changes.</span>
              <div className="flex gap-2">
                <Button disabled={isSaving} onClick={discard} type="button" variant="ghost">
                  <Undo2 aria-hidden="true" className="h-4 w-4" /> Discard
                </Button>
                <Button aria-busy={isSaving} disabled={isSaving} type="submit">
                  {isSaving ? (
                    <>
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save aria-hidden="true" className="h-4 w-4" /> Save changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </form>

        {/* real integration contract — the point that makes this plug-and-play */}
        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — the avatar and bio counter update live, and the
              save bar only appears while <code>form</code> differs from the saved baseline. To make
              it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Seed <code>INITIAL_FORM</code> from your account service (server component or a{' '}
                <code>GET /api/settings</code>) so the page loads already populated.
              </li>
              <li>
                On <b>Save</b>, <code>PATCH /api/settings</code> with the diff, then adopt the
                server's echoed record into <code>saved</code> — that clears the dirty bar exactly
                like the demo.
              </li>
              <li>
                Validate the email and (if it changed) kick off your verification flow before
                trusting it; keep the inline error path.
              </li>
              <li>
                Persist <code>theme</code> to your theme provider and the notification switches to
                your messaging preferences; <code>Discard</code> already resets to the last saved
                state.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="slide" title="Settings motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
