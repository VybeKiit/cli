'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@vybekiit/ui/empty';
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { Switch } from '@vybekiit/ui/switch';
import { Textarea } from '@vybekiit/ui/textarea';
import { Bell, Check, Mail, Send, Trash2 } from 'lucide-react';
import { type FormEvent, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

/** One notification preference row. */
type Preference = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
};

/** One entry in the local send / notification log. */
type LogEntry = {
  readonly id: string;
  readonly kind: 'email' | 'pref';
  readonly summary: string;
  readonly at: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_PREFS: readonly Preference[] = [
  {
    id: 'pref_product',
    label: 'Product updates',
    description: 'Feature launches and changelog digests.',
    enabled: true,
  },
  {
    id: 'pref_billing',
    label: 'Billing alerts',
    description: 'Invoices, failed payments, and renewals.',
    enabled: true,
  },
  {
    id: 'pref_weekly',
    label: 'Weekly summary',
    description: 'One email with the week’s activity.',
    enabled: false,
  },
  {
    id: 'pref_security',
    label: 'Security alerts',
    description: 'New device sign-in and permission changes.',
    enabled: true,
  },
];

/**
 * Interactive email + notification prefs: validated test send, toggles, and a local log.
 * Plug-in panel maps onto notifications_log.
 *
 * @returns The email notifications recipe element.
 * @example
 * const element = <EmailNotificationsPage />;
 */
export const EmailNotificationsPage = () => {
  // TODO: Send test emails through the configured email provider.
  // TODO: Save notification preferences through the notifications feature.
  const emailId = useId();
  const bodyId = useId();
  const emailErrorId = useId();

  const [email, setEmail] = useState('customer@example.com');
  const [body, setBody] = useState('Welcome to your new workspace.');
  const [emailTouched, setEmailTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [prefs, setPrefs] = useState<readonly Preference[]>(INITIAL_PREFS);
  const [baselinePrefs, setBaselinePrefs] = useState<readonly Preference[]>(INITIAL_PREFS);
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [prefFilter, setPrefFilter] = useState<'all' | 'on' | 'off'>('all');

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const bodyValid = body.trim().length >= 4;
  const prefsDirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(baselinePrefs),
    [prefs, baselinePrefs],
  );

  const visiblePrefs = useMemo(() => {
    if (prefFilter === 'on') {
      return prefs.filter((pref) => pref.enabled);
    }
    if (prefFilter === 'off') {
      return prefs.filter((pref) => !pref.enabled);
    }
    return prefs;
  }, [prefs, prefFilter]);

  const enabledCount = prefs.filter((pref) => pref.enabled).length;

  const sendTest = (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!(emailValid && bodyValid)) {
      return;
    }
    setSending(true);
    globalThis.setTimeout(() => {
      setSending(false);
      const entry: LogEntry = {
        id: `log_${Date.now()}`,
        kind: 'email',
        summary: `Test email → ${email.trim()}`,
        at: 'Just now',
      };
      setLog((current) => [entry, ...current].slice(0, 12));
      setNotice('Test email queued.');
    }, 700);
  };

  const togglePref = (id: string) => {
    setPrefs((current) =>
      current.map((pref) => (pref.id === id ? { ...pref, enabled: !pref.enabled } : pref)),
    );
  };

  const savePrefs = () => {
    setBaselinePrefs(prefs);
    const entry: LogEntry = {
      id: `log_${Date.now()}`,
      kind: 'pref',
      summary: `Saved ${enabledCount} enabled preference${enabledCount === 1 ? '' : 's'}`,
      at: 'Just now',
    };
    setLog((current) => [entry, ...current].slice(0, 12));
    setNotice('Notification preferences saved.');
  };

  const clearLog = () => {
    setLog([]);
    setNotice('Log cleared.');
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Email notifications motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Communication
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Email & notifications</h1>
          <p className="max-w-xl text-muted-foreground">
            Send a validated test email and manage alert preferences. Both write into a local log.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              { key: 'prefs-on', label: 'Prefs on', value: enabledCount },
              { key: 'log-rows', label: 'Log rows', value: log.length },
              { key: 'dirty', label: 'Dirty', value: prefsDirty ? 1 : 0 },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail aria-hidden="true" className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Send a test email</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" noValidate={true} onSubmit={sendTest}>
                <div className="space-y-1.5">
                  <Label htmlFor={emailId}>To</Label>
                  <Input
                    aria-describedby={emailTouched && !emailValid ? emailErrorId : undefined}
                    aria-invalid={emailTouched && !emailValid}
                    id={emailId}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                  {emailTouched && !emailValid ? (
                    <p className="text-destructive text-sm" id={emailErrorId}>
                      Enter a valid email address.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={bodyId}>Message</Label>
                  <Textarea
                    id={bodyId}
                    onChange={(event) => setBody(event.target.value)}
                    rows={4}
                    value={body}
                  />
                  {body.trim().length > 0 && !bodyValid ? (
                    <p className="text-destructive text-sm">Write at least 4 characters.</p>
                  ) : null}
                </div>
                <Button disabled={sending} type="submit">
                  <Send aria-hidden="true" className="h-4 w-4" />
                  {sending ? 'Sending…' : 'Send test'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Bell aria-hidden="true" className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">Alert preferences</CardTitle>
              </div>
              <Button disabled={!prefsDirty} onClick={savePrefs} size="sm" type="button">
                <Check aria-hidden="true" className="h-4 w-4" />
                Save
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="flex flex-wrap gap-1">
                {(['all', 'on', 'off'] as const).map((value) => (
                  <button
                    aria-pressed={prefFilter === value}
                    className={cn(
                      'rounded-md border px-2.5 py-1 font-medium text-xs capitalize transition-colors',
                      prefFilter === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={value}
                    onClick={() => setPrefFilter(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
              {visiblePrefs.length === 0 ? (
                <Empty className="border-0 bg-transparent py-8" variant="compact">
                  <EmptyHeader>
                    <EmptyDescription>No preferences match this filter.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul aria-label="Notification preferences" className="space-y-2">
                  {visiblePrefs.map((pref) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      key={pref.id}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{pref.label}</p>
                        <p className="text-muted-foreground text-xs">{pref.description}</p>
                      </div>
                      <Switch
                        aria-label={`Toggle ${pref.label}`}
                        checked={pref.enabled}
                        onCheckedChange={() => togglePref(pref.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Activity log</CardTitle>
            <Button
              disabled={log.length === 0}
              onClick={clearLog}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear
            </Button>
          </CardHeader>
          <CardContent className="p-3">
            {log.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Bell aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No activity yet</EmptyTitle>
                  <EmptyDescription>
                    Send a test or save preferences to fill this log.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul aria-label="Activity log" className="divide-y">
                {log.map((entry) => (
                  <li className="flex items-center justify-between gap-3 py-2.5" key={entry.id}>
                    <div className="flex items-center gap-2">
                      <Badge className="font-normal capitalize" variant="outline">
                        {entry.kind}
                      </Badge>
                      <span className="text-sm">{entry.summary}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{entry.at}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — validation, toggles, dirty save, and log all work
            offline. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset notifications_log</code> for delivery history.
            </li>
            <li>
              Send test → <code>POST /api/email/test</code> through the configured email provider;
              append the response to the log.
            </li>
            <li>
              Save prefs → <code>PUT /api/notification-preferences</code>; keep the dirty guard so
              Save stays disabled when nothing changed.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
