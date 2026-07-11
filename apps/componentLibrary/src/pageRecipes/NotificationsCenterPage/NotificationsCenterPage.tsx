'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Kpi } from '@vybekiit/ui/kpi';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Switch } from '@vybekiit/ui/switch';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Loader2,
  Mail,
  MessageSquare,
  Save,
  Shield,
} from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { PrefRow } from './PrefRow';

type NotifCategory = 'activity' | 'billing' | 'security';
type CategoryFilter = 'all' | NotifCategory | 'unread';

/** One in-app notification row (mirrors notifications_log-shaped data). */
type Notification = {
  readonly id: string;
  readonly category: NotifCategory;
  readonly title: string;
  readonly body: string;
  readonly at: string;
  readonly read: boolean;
};

/** Channel preference switches. */
type ChannelPrefs = {
  readonly email: boolean;
  readonly push: boolean;
  readonly inApp: boolean;
  readonly digest: boolean;
};

const CATEGORY_META: Record<
  NotifCategory,
  { readonly label: string; readonly className: string; readonly icon: ReactNode }
> = {
  activity: {
    label: 'Activity',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
    icon: <MessageSquare aria-hidden="true" className="h-4 w-4" />,
  },
  billing: {
    label: 'Billing',
    className: 'border-violet-500/30 bg-violet-500/10 text-violet-600',
    icon: <CreditCard aria-hidden="true" className="h-4 w-4" />,
  },
  security: {
    label: 'Security',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
    icon: <Shield aria-hidden="true" className="h-4 w-4" />,
  },
};

const FILTERS: readonly { readonly value: CategoryFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'activity', label: 'Activity' },
  { value: 'billing', label: 'Billing' },
  { value: 'security', label: 'Security' },
];

const INITIAL_NOTIFICATIONS: readonly Notification[] = [
  {
    id: 'n_01',
    category: 'security',
    title: 'New sign-in from Berlin',
    body: 'Firefox on Windows signed in 5h ago. Revoke the session if this was not you.',
    at: '5h ago',
    read: false,
  },
  {
    id: 'n_02',
    category: 'activity',
    title: 'Maya mentioned you in Tasks',
    body: '“Can you review the webhook retry UI before ship?”',
    at: '2h ago',
    read: false,
  },
  {
    id: 'n_03',
    category: 'billing',
    title: 'Invoice VK-4821 paid',
    body: 'Receipt emailed to you@example.com.',
    at: '1d ago',
    read: false,
  },
  {
    id: 'n_04',
    category: 'activity',
    title: 'Sam assigned you a task',
    body: 'Write onboarding email copy · due tomorrow.',
    at: '1d ago',
    read: true,
  },
  {
    id: 'n_05',
    category: 'billing',
    title: 'Trial ending in 3 days',
    body: 'Orbit Health Growth trial converts on Jul 13 unless canceled.',
    at: '2d ago',
    read: true,
  },
  {
    id: 'n_06',
    category: 'security',
    title: 'API key rotated',
    body: 'Production key pk_live_9f2a… was rotated by Jordan.',
    at: '3d ago',
    read: true,
  },
];

/**
 * A production-shaped notifications center: category/unread filters, mark read, mark all, and
 * channel preference toggles with save. Fully interactive with local state; plug-in panel maps to
 * `vybekiit apply-preset notifications_log`.
 *
 * @returns The notifications center recipe element.
 * @example
 * const element = <NotificationsCenterPage />;
 */
export const NotificationsCenterPage = () => {
  // TODO: Load notifications from the notifications_log preset via GET /api/notifications.
  // TODO: Persist read state and channel preferences through notification mutations.
  const filterLabelId = useId();
  const emailPrefId = useId();
  const pushPrefId = useId();
  const inAppPrefId = useId();
  const digestPrefId = useId();

  const [items, setItems] = useState<readonly Notification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [prefs, setPrefs] = useState<ChannelPrefs>({
    email: true,
    push: false,
    inApp: true,
    digest: true,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === 'all') {
      return items;
    }
    if (filter === 'unread') {
      return items.filter((item) => !item.read);
    }
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const markRead = (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setNotice('All notifications marked read.');
  };

  const savePrefs = () => {
    setSaving(true);
    setNotice(null);
    globalThis.setTimeout(() => {
      setSaving(false);
      setNotice('Notification preferences saved.');
    }, 650);
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Notifications motion pass">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Notifications
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Notifications</h1>
            <p className="max-w-xl text-muted-foreground">
              Inbox for activity, billing, and security. Filter unread, mark items read, and tune
              channels.
            </p>
          </div>
          <Button
            disabled={unreadCount === 0}
            onClick={markAllRead}
            type="button"
            variant="outline"
          >
            <CheckCheck aria-hidden="true" className="h-4 w-4" /> Mark all read
          </Button>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <Alert className="mb-4" variant="success">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              {
                key: 'unread',
                label: 'Unread',
                value: String(unreadCount),
                valueClassName: unreadCount > 0 ? 'text-blue-600' : undefined,
              },
              { key: 'total', label: 'Total', value: String(items.length) },
              { key: 'email', label: 'Email', value: prefs.email ? 'On' : 'Off' },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm" id={filterLabelId}>
                Show
              </span>
              <SegmentedControl
                aria-labelledby={filterLabelId}
                onValueChange={(value) => setFilter(value as typeof filter)}
                value={filter}
              >
                {FILTERS.map((option) => (
                  <SegmentedControlItem key={option.value} value={option.value}>
                    {option.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </div>

            <Card>
              <CardContent className="p-2 sm:p-3">
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-14 text-center">
                    <Bell aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                    <h2 className="mt-3 font-semibold">All caught up</h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {filter === 'unread'
                        ? 'No unread notifications.'
                        : 'Nothing in this category right now.'}
                    </p>
                    {filter === 'all' ? null : (
                      <Button
                        className="mt-4"
                        onClick={() => setFilter('all')}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Show all
                      </Button>
                    )}
                  </div>
                ) : (
                  <ul aria-label="Notification feed" className="divide-y">
                    {visible.map((item) => {
                      const meta = CATEGORY_META[item.category];
                      return (
                        <li
                          className={cn(
                            'flex items-start gap-3 px-2 py-3',
                            !item.read && 'bg-primary/5',
                          )}
                          key={item.id}
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            {meta.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={cn('font-medium text-sm', !item.read && 'font-semibold')}
                              >
                                {item.title}
                              </p>
                              {item.read ? null : (
                                <span
                                  aria-label="Unread"
                                  className="h-2 w-2 rounded-full bg-blue-600"
                                  role="img"
                                />
                              )}
                            </div>
                            <p className="mt-0.5 text-muted-foreground text-sm">{item.body}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                              <Badge
                                className={cn('font-normal', meta.className)}
                                variant="outline"
                              >
                                {meta.label}
                              </Badge>
                              <span>{item.at}</span>
                            </p>
                          </div>
                          {item.read ? null : (
                            <Button
                              onClick={() => markRead(item.id)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              Mark read
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

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail aria-hidden="true" className="h-4 w-4" /> Channels
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Choose where notifications are delivered.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrefRow
                checked={prefs.email}
                description="Every high-priority event"
                id={emailPrefId}
                label="Email"
                onChange={(email) => setPrefs((p) => ({ ...p, email }))}
              />
              <PrefRow
                checked={prefs.push}
                description="Mobile push for urgent items"
                id={pushPrefId}
                label="Push"
                onChange={(push) => setPrefs((p) => ({ ...p, push }))}
              />
              <PrefRow
                checked={prefs.inApp}
                description="Keep a full inbox history"
                id={inAppPrefId}
                label="In-app"
                onChange={(inApp) => setPrefs((p) => ({ ...p, inApp }))}
              />
              <PrefRow
                checked={prefs.digest}
                description="Daily summary of lower priority"
                id={digestPrefId}
                label="Email digest"
                onChange={(digest) => setPrefs((p) => ({ ...p, digest }))}
              />
              <Button className="w-full" disabled={saving} onClick={savePrefs} type="button">
                {saving ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="h-4 w-4" />
                )}
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </div>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — filters, mark-read, and channel prefs all update
            live. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset notifications_log</code> for delivery history (
              <code>channel</code>, <code>status</code>, <code>payload</code>).
            </li>
            <li>
              <code>GET /api/notifications</code> lists in-app rows;{' '}
              <code>PATCH /api/notifications/:id</code> sets <code>read</code>.
            </li>
            <li>
              Persist channel prefs on the user profile; email/push still write delivery rows to{' '}
              <code>notifications_log</code> via <code>@vybekiit/notifications</code>.
            </li>
            <li>
              Security and billing categories should never be fully muted — keep at least email for
              those.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
