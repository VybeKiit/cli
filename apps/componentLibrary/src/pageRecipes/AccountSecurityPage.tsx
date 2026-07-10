'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Switch } from '@vybekiit/ui/switch';
import {
  CheckCircle2,
  Download,
  KeyRound,
  Laptop,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type SessionKind = 'desktop' | 'mobile';

/** One signed-in session (browser / device). */
type Session = {
  readonly id: string;
  readonly device: string;
  readonly kind: SessionKind;
  readonly location: string;
  readonly lastActive: string;
  readonly current: boolean;
  readonly trusted: boolean;
};

const INITIAL_SESSIONS: readonly Session[] = [
  {
    id: 'ses_01',
    device: 'Chrome on macOS',
    kind: 'desktop',
    location: 'San Francisco, US',
    lastActive: 'Now',
    current: true,
    trusted: true,
  },
  {
    id: 'ses_02',
    device: 'Safari on iPhone',
    kind: 'mobile',
    location: 'San Francisco, US',
    lastActive: '2h ago',
    current: false,
    trusted: true,
  },
  {
    id: 'ses_03',
    device: 'Firefox on Windows',
    kind: 'desktop',
    location: 'Berlin, DE',
    lastActive: '1d ago',
    current: false,
    trusted: false,
  },
  {
    id: 'ses_04',
    device: 'Edge on Windows',
    kind: 'desktop',
    location: 'Unknown',
    lastActive: '5d ago',
    current: false,
    trusted: false,
  },
];

const RECOVERY_CODES = [
  'VK-7F2A-91CD',
  'VK-3B8E-40AF',
  'VK-9D1C-62E7',
  'VK-5A0B-18F4',
  'VK-C4E2-77B9',
  'VK-1F6D-A3C0',
  'VK-8E9A-2D5B',
  'VK-0B4C-6F81',
  'VK-D7A3-E92F',
  'VK-2C5E-B140',
] as const;

/**
 * A production-shaped account security page: 2FA toggle, active sessions with revoke, trusted-device
 * flags, recovery-code generation/download, and policy switches. Fully interactive with local state;
 * the plug-in panel maps sessions and recovery events onto the audit_log preset.
 *
 * @returns The account security recipe element.
 * @example
 * const element = <AccountSecurityPage />;
 */
export const AccountSecurityPage = () => {
  // TODO: Load sessions and recovery-code status from GET /api/account/security (auth provider + audit_log).
  // TODO: Persist 2FA, session revoke, and policy changes via audited account security mutations.
  const twoFaId = useId();
  const reauthId = useId();
  const alertsId = useId();

  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [requireReauth, setRequireReauth] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessions, setSessions] = useState<readonly Session[]>(INITIAL_SESSIONS);
  const [codesVisible, setCodesVisible] = useState(false);
  const [codesRemaining, setCodesRemaining] = useState(10);
  const [rotating, setRotating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const kpis = useMemo(
    () => ({
      sessions: sessions.length,
      trusted: sessions.filter((s) => s.trusted).length,
      unknown: sessions.filter((s) => !s.trusted).length,
    }),
    [sessions],
  );

  const revokeSession = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (target === undefined || target.current) {
      return;
    }
    setSessions((current) => current.filter((s) => s.id !== id));
    setNotice(`Revoked ${target.device}.`);
  };

  const toggleTrusted = (id: string) => {
    setSessions((current) => current.map((s) => (s.id === id ? { ...s, trusted: !s.trusted } : s)));
  };

  const rotateCodes = () => {
    setRotating(true);
    setCodesVisible(false);
    globalThis.setTimeout(() => {
      setCodesRemaining(10);
      setCodesVisible(true);
      setRotating(false);
      setNotice('Recovery codes rotated. Download and store them safely.');
    }, 800);
  };

  const downloadCodes = () => {
    if (!codesVisible) {
      setCodesVisible(true);
    }
    setDownloading(true);
    globalThis.setTimeout(() => {
      setDownloading(false);
      setNotice('recovery-codes.txt ready (demo download).');
    }, 600);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Security
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Account security</h1>
          <p className="max-w-xl text-muted-foreground">
            Manage two-factor auth, active sessions, trusted devices, and recovery codes. Revoke a
            session or rotate codes to see live updates.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 text-sm">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            {notice}
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label="2FA"
            value={twoFaEnabled ? 'On' : 'Off'}
            valueClassName={twoFaEnabled ? 'text-emerald-600' : 'text-amber-600'}
          />
          <Kpi label="Sessions" value={String(kpis.sessions)} />
          <Kpi label="Trusted" value={String(kpis.trusted)} />
          <Kpi
            label="Codes left"
            value={String(codesRemaining)}
            valueClassName={codesRemaining < 5 ? 'text-amber-600' : undefined}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Two-factor authentication
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Authenticator app required at sign-in.
                  </p>
                </div>
                <Switch
                  aria-label="Toggle two-factor authentication"
                  checked={twoFaEnabled}
                  id={twoFaId}
                  onCheckedChange={setTwoFaEnabled}
                />
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active sessions</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {kpis.unknown > 0
                    ? `${kpis.unknown} untrusted device(s) — review them.`
                    : 'All devices are trusted.'}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0 sm:p-4 sm:pt-0">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <KeyRound aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                    <h2 className="mt-3 font-semibold">No active sessions</h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Sign in again to create a session row.
                    </p>
                  </div>
                ) : (
                  <ul aria-label="Active sessions" className="divide-y">
                    {sessions.map((session) => {
                      const Icon = session.kind === 'mobile' ? Smartphone : Laptop;
                      return (
                        <li
                          className="flex flex-wrap items-start justify-between gap-3 py-3"
                          key={session.id}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <Icon aria-hidden="true" className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">
                                {session.device}
                                {session.current ? (
                                  <Badge className="ml-2 font-normal" variant="secondary">
                                    This device
                                  </Badge>
                                ) : null}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {session.location} · {session.lastActive}
                              </p>
                              <button
                                className={cn(
                                  'mt-1 text-xs underline-offset-2 hover:underline',
                                  session.trusted ? 'text-emerald-600' : 'text-amber-600',
                                )}
                                onClick={() => toggleTrusted(session.id)}
                                type="button"
                              >
                                {session.trusted ? 'Trusted' : 'Untrusted — mark trusted'}
                              </button>
                            </div>
                          </div>
                          {session.current ? null : (
                            <Button
                              aria-label={`Revoke ${session.device}`}
                              onClick={() => revokeSession(session.id)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Revoke
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound aria-hidden="true" className="h-4 w-4" /> Recovery codes
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {codesRemaining} unused codes. Download once and store offline.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {codesVisible ? (
                  <ul className="grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-2">
                    {RECOVERY_CODES.map((code) => (
                      <li className="rounded border bg-muted/40 px-2 py-1" key={code}>
                        {code}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-md border border-dashed px-3 py-6 text-center text-muted-foreground text-sm">
                    Codes are hidden until you generate or download.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={rotating} onClick={rotateCodes} size="sm" type="button">
                    {rotating ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    )}
                    Rotate codes
                  </Button>
                  <Button
                    disabled={downloading}
                    onClick={downloadCodes}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {downloading ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download aria-hidden="true" className="h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Re-auth for sensitive actions</p>
                    <p className="text-muted-foreground text-xs">
                      Password before email or 2FA changes.
                    </p>
                  </div>
                  <Switch
                    aria-label="Require re-authentication"
                    checked={requireReauth}
                    id={reauthId}
                    onCheckedChange={setRequireReauth}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Login alerts</p>
                    <p className="text-muted-foreground text-xs">
                      Email when a new device signs in.
                    </p>
                  </div>
                  <Switch
                    aria-label="Toggle login alerts"
                    checked={loginAlerts}
                    id={alertsId}
                    onCheckedChange={setLoginAlerts}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — 2FA, session revoke, trust flags, and recovery
              codes all update live. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Load sessions from your auth provider (<code>@vybekiit/auth</code> list-sessions /
                revoke-session).
              </li>
              <li>
                Run <code>vybekiit apply-preset audit_log</code> and write security actions (revoke,
                rotate codes, policy flips) as append-only rows.
              </li>
              <li>
                <code>GET /api/account/security</code> returns sessions + 2FA + codes-remaining;{' '}
                <code>POST /api/account/security/codes</code> rotates recovery codes.
              </li>
              <li>
                Keep revoke of the current session blocked (or force re-login) and never show
                recovery codes after the first download.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="scale" title="Account security motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** Small KPI tile. */
const Kpi = ({
  label,
  value,
  valueClassName,
}: {
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string;
}) => (
  <Card>
    <CardContent className="p-3 text-center">
      <p className={cn('font-semibold text-2xl tabular-nums', valueClassName)}>{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </CardContent>
  </Card>
);
