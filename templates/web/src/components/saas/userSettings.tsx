'use client';

import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { IntegrationTodo } from '@/components/saas/integrationTodo';
import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { Avatar, AvatarFallback } from '@vybekiit/ui/avatar';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
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
import { type FormEvent, useId, useState } from 'react';

type ThemePref = 'system' | 'light' | 'dark';
type NotificationKey = 'productUpdates' | 'billingReceipts' | 'securityAlerts' | 'weeklyDigest';
type SaveStatus = 'idle' | 'saving' | 'saved';

interface SettingsForm {
  readonly fullName: string;
  readonly username: string;
  readonly email: string;
  readonly bio: string;
  readonly timezone: string;
  readonly theme: ThemePref;
  readonly notifications: Readonly<Record<NotificationKey, boolean>>;
}

const BIO_MAX = 160;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM: SettingsForm = {
  fullName: 'Maya Chen',
  username: 'mayac',
  email: 'maya@example.com',
  bio: 'Founder building analytics tools.',
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
 * Interactive account settings surface: profile, theme, notifications, dirty-state save bar.
 * Local practice state until `save-data` / auth profile wiring is applied.
 *
 * @returns The signed-in settings page.
 * @example
 * <UserSettingsPage />
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
  const isSaving = status === 'saving';

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
    // TODO(vybekiit): PATCH /api/settings — skill: save-data
    globalThis.setTimeout(() => {
      setSaved(form);
      setStatus('saved');
    }, 800);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, preferences, and notifications. Change anything to reveal the save
          bar.
        </p>
      </header>

      <form className="space-y-6" noValidate={true} onSubmit={save}>
        {status === 'saved' && !dirty ? (
          <Alert>
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>Settings saved</AlertTitle>
            <AlertDescription>Your changes are live (practice mode until wired).</AlertDescription>
          </Alert>
        ) : null}

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
                    onChange={(event) => update('username', event.target.value.replace(/\s+/g, ''))}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" id={themeLabelId}>
              <Palette aria-hidden="true" className="h-4 w-4" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              aria-labelledby={themeLabelId}
              className="w-full"
              onValueChange={(value) => update('theme', value as ThemePref)}
              value={form.theme}
            >
              {THEMES.map((option) => (
                <SegmentedControlItem className="flex-1" key={option.id} value={option.id}>
                  {option.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </CardContent>
        </Card>

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

      <IntegrationTodo
        feature="settings"
        todos={[
          'PATCH /api/settings with the form payload (skill: save-data).',
          'Load the signed-in user profile on mount instead of practice defaults.',
          'Wire notification toggles through add-notifications when email/push is live.',
        ]}
      />
    </div>
  );
};
