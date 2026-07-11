'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@vybekiit/ui/empty';
import { Kpi } from '@vybekiit/ui/kpi';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Activity, Pause, Play, RadioTower, RefreshCcw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type ChannelId = 'orders' | 'presence' | 'support';
type ConnState = 'connected' | 'connecting' | 'disconnected';

/** One live activity event (mirrors realtime_publications payloads). */
type LiveEvent = {
  readonly id: string;
  readonly channel: ChannelId;
  readonly title: string;
  readonly detail: string;
  readonly at: string;
};

const CHANNELS: readonly {
  readonly id: ChannelId;
  readonly label: string;
  readonly topic: string;
}[] = [
  { id: 'orders', label: 'Orders', topic: 'public:orders' },
  { id: 'presence', label: 'Presence', topic: 'public:presence' },
  { id: 'support', label: 'Support', topic: 'private:support' },
];

const SEED_EVENTS: readonly LiveEvent[] = [
  {
    id: 'evt_01',
    channel: 'orders',
    title: 'Order paid',
    detail: 'ord_8842 · $49.00 · Aria M.',
    at: '12s ago',
  },
  {
    id: 'evt_02',
    channel: 'presence',
    title: 'User online',
    detail: 'maya@northwind.io joined workspace',
    at: '41s ago',
  },
  {
    id: 'evt_03',
    channel: 'support',
    title: 'Ticket opened',
    detail: 'tkt_1042 · Checkout hangs on Safari',
    at: '2m ago',
  },
];

const SIMULATED: readonly Omit<LiveEvent, 'id' | 'at'>[] = [
  {
    channel: 'orders',
    title: 'Refund started',
    detail: 'ord_8810 · partial · $12.00',
  },
  {
    channel: 'presence',
    title: 'Typing…',
    detail: 'sam@orbit.app in #launch',
  },
  {
    channel: 'support',
    title: 'Agent replied',
    detail: 'tkt_1042 · Jordan L.',
  },
  {
    channel: 'orders',
    title: 'Cart abandoned',
    detail: 'session_22 · 3 items',
  },
  {
    channel: 'presence',
    title: 'User offline',
    detail: 'lee@harbor.io idle 15m',
  },
];

/**
 * Interactive realtime activity feed: connect/disconnect, channel filter, simulated live events.
 * Plug-in panel maps onto the realtime_publications preset.
 *
 * @returns The realtime recipe element.
 * @example
 * const element = <RealtimePage />;
 */
export const RealtimePage = () => {
  // TODO: Subscribe to the configured realtime publication.
  // TODO: Replace default activity labels with live events from the database.
  const filterLabelId = useId();

  const [connection, setConnection] = useState<ConnState>('connected');
  const [listening, setListening] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelId | 'all'>('all');
  const [events, setEvents] = useState<readonly LiveEvent[]>(SEED_EVENTS);
  const [notice, setNotice] = useState<string | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!listening || connection !== 'connected') {
      return;
    }
    const timer = globalThis.setInterval(() => {
      const sample = SIMULATED[tickRef.current % SIMULATED.length];
      if (!sample) {
        return;
      }
      tickRef.current += 1;
      const next: LiveEvent = {
        ...sample,
        id: `evt_${Date.now()}`,
        at: 'just now',
      };
      setEvents((current) => [next, ...current].slice(0, 24));
    }, 2800);
    return () => {
      globalThis.clearInterval(timer);
    };
  }, [listening, connection]);

  const visible = useMemo(
    () =>
      channelFilter === 'all' ? events : events.filter((event) => event.channel === channelFilter),
    [events, channelFilter],
  );

  const reconnect = () => {
    setConnection('connecting');
    setNotice('Reconnecting…');
    globalThis.setTimeout(() => {
      setConnection('connected');
      setListening(true);
      setNotice('Channel connected.');
    }, 900);
  };

  const disconnect = () => {
    setConnection('disconnected');
    setListening(false);
    setNotice('Channel disconnected.');
  };

  const clearFeed = () => {
    setEvents([]);
    setNotice('Activity feed cleared.');
  };

  let connectionDisplay = 'Off';
  if (connection === 'connected') {
    connectionDisplay = 'Live';
  } else if (connection === 'connecting') {
    connectionDisplay = '…';
  }

  let feedBody: ReactNode;
  if (connection === 'disconnected') {
    feedBody = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <WifiOff aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Channel offline</EmptyTitle>
          <EmptyDescription>Reconnect to stream publication events again.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reconnect} size="sm" type="button">
            Reconnect
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else if (visible.length === 0) {
    feedBody = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <RadioTower aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Waiting for events</EmptyTitle>
          <EmptyDescription>
            {channelFilter === 'all'
              ? 'Resume listening or wait for the next publication.'
              : 'Nothing on this channel yet — try All.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    feedBody = (
      <ul aria-label="Live activity" className="divide-y">
        {visible.map((event) => (
          <li className="flex items-start gap-3 px-2 py-3" key={event.id}>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
              <RadioTower aria-hidden="true" className="h-4 w-4 text-emerald-600" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{event.title}</p>
                <Badge className="font-normal capitalize" variant="secondary">
                  {event.channel}
                </Badge>
              </div>
              <p className="mt-0.5 text-muted-foreground text-sm">{event.detail}</p>
            </div>
            <span className="shrink-0 text-muted-foreground text-xs">{event.at}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Realtime motion pass">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Realtime
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Live activity</h1>
            <p className="max-w-xl text-muted-foreground">
              Watch publication events stream in. Pause the feed, filter by channel, or reconnect.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {connection === 'connected' ? (
              <Button onClick={disconnect} type="button" variant="outline">
                <WifiOff aria-hidden="true" className="h-4 w-4" /> Disconnect
              </Button>
            ) : (
              <Button onClick={reconnect} type="button">
                <RefreshCcw
                  aria-hidden="true"
                  className={cn('h-4 w-4', connection === 'connecting' && 'animate-spin')}
                />
                {connection === 'connecting' ? 'Connecting…' : 'Reconnect'}
              </Button>
            )}
            <Button
              disabled={connection !== 'connected'}
              onClick={() => setListening((value) => !value)}
              type="button"
              variant="outline"
            >
              {listening ? (
                <>
                  <Pause aria-hidden="true" className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play aria-hidden="true" className="h-4 w-4" /> Resume
                </>
              )}
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              {
                key: 'connection',
                icon:
                  connection === 'connected' ? (
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  ),
                label: 'Connection',
                value: connectionDisplay,
              },
              {
                key: 'events',
                icon: <Activity className="h-4 w-4 text-blue-600" />,
                label: 'Events',
                value: String(events.length),
              },
              {
                key: 'listening',
                icon: <RadioTower className="h-4 w-4 text-amber-600" />,
                label: 'Listening',
                value: listening && connection === 'connected' ? 'Yes' : 'No',
              },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm" id={filterLabelId}>
            Channel
          </span>
          <SegmentedControl
            aria-labelledby={filterLabelId}
            onValueChange={(value) => setChannelFilter(value as typeof channelFilter)}
            value={channelFilter}
          >
            <SegmentedControlItem value="all">All</SegmentedControlItem>
            {CHANNELS.map((channel) => (
              <SegmentedControlItem key={channel.id} value={channel.id}>
                {channel.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <Button
            className="ml-auto"
            disabled={events.length === 0}
            onClick={clearFeed}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Publication topics</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHANNELS.map((channel) => (
                <Badge className="font-mono font-normal" key={channel.id} variant="outline">
                  {channel.topic}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">{feedBody}</CardContent>
        </Card>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — the demo interval stands in for a socket. To make
            it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset realtime_publications</code> for publication registry
              rows.
            </li>
            <li>
              Subscribe with your realtime client to each topic (<code>public:orders</code>, etc.)
              on connect.
            </li>
            <li>
              Map each payload to <code>{'{ id, channel, title, detail, at }'}</code> and prepend to
              the feed (keep Pause / Clear).
            </li>
            <li>
              Disconnect should leave the channel; Reconnect re-subscribes and optionally backfills
              recent rows from the DB.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
