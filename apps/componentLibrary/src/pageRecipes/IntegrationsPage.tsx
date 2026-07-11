'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Kpi } from '@vybekiit/ui/kpi';
import { Switch } from '@vybekiit/ui/switch';
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  Webhook,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type ConnectionStatus = 'connected' | 'needs_refresh' | 'disconnected';

/** One OAuth / third-party connection. */
type Integration = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: ConnectionStatus;
  readonly scopes: readonly string[];
};

/** One developer API key. */
type ApiKey = {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly createdAt: string;
  readonly lastUsed: string;
  readonly secret?: string;
};

/** One outbound webhook endpoint. */
type WebhookEndpoint = {
  readonly id: string;
  readonly url: string;
  readonly events: readonly string[];
  readonly failing: boolean;
  readonly lastDelivery: string;
};

const STATUS_META: Record<
  ConnectionStatus,
  { readonly label: string; readonly className: string }
> = {
  connected: {
    label: 'Connected',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  needs_refresh: {
    label: 'Needs refresh',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  disconnected: {
    label: 'Disconnected',
    className: 'border-border bg-muted text-muted-foreground',
  },
};

const INITIAL_INTEGRATIONS: readonly Integration[] = [
  {
    id: 'int_github',
    name: 'GitHub',
    description: 'Repo invites and org membership for buyers.',
    status: 'connected',
    scopes: ['read:org', 'admin:org_hook'],
  },
  {
    id: 'int_google',
    name: 'Google',
    description: 'Sign-in with Google for customer accounts.',
    status: 'connected',
    scopes: ['openid', 'email', 'profile'],
  },
  {
    id: 'int_slack',
    name: 'Slack',
    description: 'Ops alerts into a workspace channel.',
    status: 'needs_refresh',
    scopes: ['chat:write', 'channels:read'],
  },
  {
    id: 'int_linear',
    name: 'Linear',
    description: 'File support tickets as issues.',
    status: 'disconnected',
    scopes: ['read', 'write'],
  },
];

const INITIAL_KEYS: readonly ApiKey[] = [
  {
    id: 'key_01',
    name: 'Production',
    prefix: 'pk_live_9f2a…',
    createdAt: 'Mar 12',
    lastUsed: '2h ago',
  },
  {
    id: 'key_02',
    name: 'Staging',
    prefix: 'pk_test_41bc…',
    createdAt: 'May 3',
    lastUsed: '1d ago',
  },
];

const INITIAL_HOOKS: readonly WebhookEndpoint[] = [
  {
    id: 'wh_01',
    url: 'https://hooks.northwind.io/vybe',
    events: ['order.paid', 'member.invited'],
    failing: false,
    lastDelivery: '12m ago',
  },
  {
    id: 'wh_02',
    url: 'https://api.orbit.app/webhooks/kit',
    events: ['subscription.updated'],
    failing: true,
    lastDelivery: 'Failed · 3h ago',
  },
];

/**
 * A production-shaped integrations console: connect/disconnect tools, create/rotate/revoke API
 * keys, and retry failed webhooks. Fully interactive with local state.
 *
 * @returns The integrations recipe element.
 * @example
 * const element = <IntegrationsPage />;
 */
export const IntegrationsPage = () => {
  // TODO: Load connected integrations, API keys, and webhooks from the integrations source.
  // TODO: Persist connect/disconnect, key rotation, and webhook retries through audited actions.
  const keysHeadingId = useId();

  const [integrations, setIntegrations] = useState<readonly Integration[]>(INITIAL_INTEGRATIONS);
  const [keys, setKeys] = useState<readonly ApiKey[]>(INITIAL_KEYS);
  const [hooks, setHooks] = useState<readonly WebhookEndpoint[]>(INITIAL_HOOKS);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const kpis = useMemo(() => {
    const connected = integrations.filter((i) => i.status === 'connected').length;
    const failing = hooks.filter((h) => h.failing).length;
    return { connected, keys: keys.length, hooks: hooks.length, failing };
  }, [integrations, keys, hooks]);

  const toggleIntegration = (id: string) => {
    setIntegrations((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        if (item.status === 'disconnected') {
          return { ...item, status: 'connected' as const };
        }
        if (item.status === 'needs_refresh') {
          return { ...item, status: 'connected' as const };
        }
        return { ...item, status: 'disconnected' as const };
      }),
    );
    setNotice('Integration status updated.');
  };

  const createKey = () => {
    setBusyId('create-key');
    globalThis.setTimeout(() => {
      const secret = `pk_live_${Math.random().toString(36).slice(2, 10)}secret`;
      const next: ApiKey = {
        id: `key_${Date.now()}`,
        name: `Key ${keys.length + 1}`,
        prefix: `${secret.slice(0, 12)}…`,
        createdAt: 'Just now',
        lastUsed: 'Never',
        secret,
      };
      setKeys((current) => [next, ...current]);
      setRevealedKeyId(next.id);
      setBusyId(null);
      setNotice('New API key created — copy it now; it will not be shown again.');
    }, 700);
  };

  const rotateKey = (id: string) => {
    setBusyId(id);
    globalThis.setTimeout(() => {
      const secret = `pk_live_${Math.random().toString(36).slice(2, 10)}rotated`;
      setKeys((current) =>
        current.map((key) =>
          key.id === id
            ? {
                ...key,
                prefix: `${secret.slice(0, 12)}…`,
                createdAt: 'Just now',
                secret,
              }
            : key,
        ),
      );
      setRevealedKeyId(id);
      setBusyId(null);
      setNotice('Key rotated. Previous secret is invalid.');
    }, 700);
  };

  const revokeKey = (id: string) => {
    setKeys((current) => current.filter((key) => key.id !== id));
    if (revealedKeyId === id) {
      setRevealedKeyId(null);
    }
    setNotice('API key revoked.');
  };

  const retryHook = (id: string) => {
    setBusyId(id);
    globalThis.setTimeout(() => {
      setHooks((current) =>
        current.map((hook) =>
          hook.id === id ? { ...hook, failing: false, lastDelivery: 'Just now · 200' } : hook,
        ),
      );
      setBusyId(null);
      setNotice('Webhook delivery retried successfully.');
    }, 800);
  };

  return (
    <DemoRecipeFrame defaultTransition="scale" title="Integrations motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Integrations
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Integrations</h1>
          <p className="max-w-xl text-muted-foreground">
            Connect tools, manage API keys, and retry failed webhooks. Secrets are reveal-once in
            this demo.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <Alert className="mb-4" variant="success">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: 'connected', label: 'Connected', value: String(kpis.connected) },
              { key: 'api-keys', label: 'API keys', value: String(kpis.keys) },
              { key: 'webhooks', label: 'Webhooks', value: String(kpis.hooks) },
              {
                key: 'failing',
                label: 'Failing',
                value: String(kpis.failing),
                valueClassName: kpis.failing > 0 ? 'text-amber-600' : undefined,
              },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <section className="mb-6 space-y-3">
          <h2 className="font-semibold text-lg">Connected tools</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {integrations.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Plug aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{item.name}</p>
                      <Badge
                        className={cn('font-normal', STATUS_META[item.status].className)}
                        variant="outline"
                      >
                        {STATUS_META[item.status].label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      Scopes: {item.scopes.join(', ')}
                    </p>
                  </div>
                  <Switch
                    aria-label={`${item.status === 'disconnected' ? 'Connect' : 'Disconnect'} ${item.name}`}
                    checked={item.status !== 'disconnected'}
                    onCheckedChange={() => toggleIntegration(item.id)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-lg" id={keysHeadingId}>
              API keys
            </h2>
            <Button disabled={busyId === 'create-key'} onClick={createKey} size="sm" type="button">
              {busyId === 'create-key' ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound aria-hidden="true" className="h-4 w-4" />
              )}
              Create key
            </Button>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {keys.length === 0 ? (
                <div className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No API keys yet. Create one to call your public API.
                </div>
              ) : (
                keys.map((key) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    key={key.id}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{key.name}</p>
                      <p className="font-mono text-muted-foreground text-xs">
                        {revealedKeyId === key.id && key.secret !== undefined
                          ? key.secret
                          : key.prefix}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Created {key.createdAt} · Last used {key.lastUsed}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {key.secret === undefined ? null : (
                        <Button
                          aria-label={revealedKeyId === key.id ? 'Hide secret' : 'Reveal secret'}
                          onClick={() =>
                            setRevealedKeyId((current) => (current === key.id ? null : key.id))
                          }
                          size="icon"
                          type="button"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          {revealedKeyId === key.id ? (
                            <EyeOff aria-hidden="true" className="h-4 w-4" />
                          ) : (
                            <Eye aria-hidden="true" className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        aria-label={`Copy ${key.name}`}
                        onClick={() => setNotice(`Copied ${key.prefix} to clipboard (demo).`)}
                        size="icon"
                        type="button"
                        variant="ghost"
                        className="h-8 w-8"
                      >
                        <Copy aria-hidden="true" className="h-4 w-4" />
                      </Button>
                      <Button
                        disabled={busyId === key.id}
                        onClick={() => rotateKey(key.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {busyId === key.id ? (
                          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                        )}
                        Rotate
                      </Button>
                      <Button
                        onClick={() => revokeKey(key.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-lg">Webhooks</h2>
          <div className="space-y-3">
            {hooks.map((hook) => (
              <Card key={hook.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Webhook aria-hidden="true" className="h-4 w-4" />
                      <span className="truncate font-mono text-sm">{hook.url}</span>
                    </CardTitle>
                    <p className="text-muted-foreground text-xs">
                      {hook.events.join(', ')} · {hook.lastDelivery}
                    </p>
                  </div>
                  {hook.failing ? (
                    <Badge
                      className="border-amber-500/40 bg-amber-500/10 font-normal text-amber-600"
                      variant="outline"
                    >
                      Failing
                    </Badge>
                  ) : (
                    <Badge
                      className="border-emerald-500/30 bg-emerald-500/10 font-normal text-emerald-600"
                      variant="outline"
                    >
                      Healthy
                    </Badge>
                  )}
                </CardHeader>
                {hook.failing ? (
                  <CardContent>
                    <Button
                      disabled={busyId === hook.id}
                      onClick={() => retryHook(hook.id)}
                      size="sm"
                      type="button"
                    >
                      {busyId === hook.id ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      )}
                      Retry delivery
                    </Button>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        </section>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — connect toggles, key create/rotate/revoke, and
            webhook retry all work offline. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Store OAuth connections and hashed API keys in your DB; never return full secrets
              after create.
            </li>
            <li>
              Webhook endpoints + delivery history can sit next to the shipped{' '}
              <code>webhook_events</code> preset for inbound Lemon Squeezy events.
            </li>
            <li>
              <code>POST /api/integrations/keys</code> creates a key (show once); rotate and revoke
              invalidate the previous hash.
            </li>
            <li>
              Write every connect, rotate, and revoke action to <code>audit_log</code>.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
