'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Textarea } from '@vybekiit/ui/textarea';
import { CircleDot, Clock, LifeBuoy, MessageSquare, Send, UserRound } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type TicketStatus = 'open' | 'pending' | 'resolved';
type Priority = 'low' | 'normal' | 'high';

/** One support message in a ticket thread. */
type Message = {
  readonly id: string;
  readonly author: string;
  readonly role: 'customer' | 'agent';
  readonly body: string;
  readonly at: string;
};

/** One support ticket with an embedded message thread. */
type Ticket = {
  readonly id: string;
  readonly subject: string;
  readonly requester: string;
  readonly status: TicketStatus;
  readonly priority: Priority;
  readonly updatedAt: string;
  readonly messages: readonly Message[];
};

const STATUS_META: Record<TicketStatus, { readonly label: string; readonly className: string }> = {
  open: {
    label: 'Open',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  resolved: {
    label: 'Resolved',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
};

const PRIORITY_META: Record<Priority, { readonly label: string; readonly className: string }> = {
  low: { label: 'Low', className: 'text-muted-foreground' },
  normal: { label: 'Normal', className: 'text-foreground' },
  high: { label: 'High', className: 'text-red-600' },
};

const INITIAL_TICKETS: readonly Ticket[] = [
  {
    id: 'tkt_1042',
    subject: 'Checkout fails on Safari 17',
    requester: 'Aria Montgomery',
    status: 'open',
    priority: 'high',
    updatedAt: '12m ago',
    messages: [
      {
        id: 'm1',
        author: 'Aria Montgomery',
        role: 'customer',
        body: 'Pay button spins forever on Safari 17 desktop. Works fine in Chrome.',
        at: 'Yesterday · 16:02',
      },
      {
        id: 'm2',
        author: 'Jordan Lee',
        role: 'agent',
        body: 'Thanks Aria — can you share a screenshot of the network tab when it hangs?',
        at: 'Yesterday · 16:40',
      },
      {
        id: 'm3',
        author: 'Aria Montgomery',
        role: 'customer',
        body: 'Attached. It looks like the /api/checkout request never returns.',
        at: '12m ago',
      },
    ],
  },
  {
    id: 'tkt_1038',
    subject: 'Need invoice for March',
    requester: 'Jonas Weber',
    status: 'pending',
    priority: 'normal',
    updatedAt: '2h ago',
    messages: [
      {
        id: 'm4',
        author: 'Jonas Weber',
        role: 'customer',
        body: 'Finance needs the March invoice PDF for our audit.',
        at: '2h ago',
      },
    ],
  },
  {
    id: 'tkt_1021',
    subject: 'SSO SAML metadata export',
    requester: 'Elena Vargas',
    status: 'open',
    priority: 'normal',
    updatedAt: '1d ago',
    messages: [
      {
        id: 'm5',
        author: 'Elena Vargas',
        role: 'customer',
        body: 'Where do I download the SAML metadata for Okta?',
        at: '1d ago',
      },
      {
        id: 'm6',
        author: 'Maya Chen',
        role: 'agent',
        body: 'Settings → Security → SSO → Download metadata. Let me know if Okta rejects it.',
        at: '1d ago',
      },
    ],
  },
  {
    id: 'tkt_0990',
    subject: 'Seat limit reached',
    requester: 'Priya Nair',
    status: 'resolved',
    priority: 'low',
    updatedAt: '3d ago',
    messages: [
      {
        id: 'm7',
        author: 'Priya Nair',
        role: 'customer',
        body: "We're blocked from inviting a 6th teammate on Growth.",
        at: '4d ago',
      },
      {
        id: 'm8',
        author: 'Sam Ortiz',
        role: 'agent',
        body: 'Bumped you to 8 seats for the trial. You can also upgrade to Scale anytime.',
        at: '3d ago',
      },
    ],
  },
  {
    id: 'tkt_0985',
    subject: 'Webhook signature mismatch',
    requester: 'Kenji Sato',
    status: 'open',
    priority: 'high',
    updatedAt: '5h ago',
    messages: [
      {
        id: 'm9',
        author: 'Kenji Sato',
        role: 'customer',
        body: 'Our webhook endpoint returns 401 on every Lemon Squeezy event.',
        at: '5h ago',
      },
    ],
  },
];

/**
 * A production-shaped support inbox: ticket list with status filter, selectable thread, live
 * status change, and a reply form that appends messages. Empty filter and empty reply validation
 * are real interactive states. Plug-in panel maps onto the support_tickets preset.
 *
 * @returns The support center recipe element.
 * @example
 * const element = <SupportCenterPage />;
 */
export const SupportCenterPage = () => {
  // TODO: Load support tickets and message threads from the support_tickets preset tables.
  // TODO: Persist status changes and replies through support ticket mutations.
  const replyId = useId();
  const replyErrorId = useId();
  const statusId = useId();
  const filterId = useId();

  const [tickets, setTickets] = useState<readonly Ticket[]>(INITIAL_TICKETS);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedId, setSelectedId] = useState<string>(INITIAL_TICKETS[0]?.id ?? '');
  const [reply, setReply] = useState('');
  const [replyTouched, setReplyTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      statusFilter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === statusFilter),
    [tickets, statusFilter],
  );

  const selected =
    visible.find((ticket) => ticket.id === selectedId) ??
    visible[0] ??
    tickets.find((ticket) => ticket.id === selectedId) ??
    null;

  const openCount = tickets.filter((t) => t.status === 'open').length;

  const setStatus = (status: TicketStatus) => {
    if (selected === null) {
      return;
    }
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === selected.id ? { ...ticket, status, updatedAt: 'Just now' } : ticket,
      ),
    );
    setNotice(`Ticket marked ${STATUS_META[status].label.toLowerCase()}.`);
  };

  const sendReply = (event: FormEvent) => {
    event.preventDefault();
    setReplyTouched(true);
    if (selected === null || reply.trim().length < 2) {
      return;
    }
    const message: Message = {
      id: `m_${Date.now()}`,
      author: 'You',
      role: 'agent',
      body: reply.trim(),
      at: 'Just now',
    };
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === selected.id
          ? {
              ...ticket,
              updatedAt: 'Just now',
              status: ticket.status === 'resolved' ? 'open' : ticket.status,
              messages: [...ticket.messages, message],
            }
          : ticket,
      ),
    );
    setReply('');
    setReplyTouched(false);
    setNotice('Reply sent.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Support
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Support center</h1>
            <p className="max-w-xl text-muted-foreground">
              Pick a ticket, change its status, and send a reply — the thread updates live.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <LifeBuoy aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <span>
              <span className="font-semibold tabular-nums">{openCount}</span> open
            </span>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* ticket list */}
          <Card className="h-fit">
            <CardHeader className="space-y-3">
              <CardTitle className="text-base">Tickets</CardTitle>
              <div className="space-y-1.5">
                <Label htmlFor={filterId}>Status filter</Label>
                <Select
                  onValueChange={(value) => setStatusFilter(value as 'all' | TicketStatus)}
                  value={statusFilter}
                >
                  <SelectTrigger id={filterId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 p-2 pt-0">
              {visible.length === 0 ? (
                <div className="px-3 py-10 text-center text-muted-foreground text-sm">
                  No tickets in this status.
                </div>
              ) : (
                <ul aria-label="Support tickets" className="space-y-1">
                  {visible.map((ticket) => {
                    const isActive = selected?.id === ticket.id;
                    return (
                      <li key={ticket.id}>
                        <button
                          aria-current={isActive ? 'true' : undefined}
                          className={cn(
                            'w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors',
                            isActive ? 'border-primary/30 bg-primary/5' : 'hover:bg-muted/60',
                          )}
                          onClick={() => setSelectedId(ticket.id)}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 font-medium text-sm leading-snug">
                              {ticket.subject}
                            </p>
                            <Badge
                              className={cn(
                                'shrink-0 font-normal text-[10px]',
                                STATUS_META[ticket.status].className,
                              )}
                              variant="outline"
                            >
                              {STATUS_META[ticket.status].label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground text-xs">
                            {ticket.requester} · {ticket.updatedAt}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* thread */}
          {selected === null ? (
            <Card className="flex min-h-[360px] items-center justify-center">
              <div className="px-4 py-12 text-center">
                <MessageSquare
                  aria-hidden="true"
                  className="mx-auto h-8 w-8 text-muted-foreground"
                />
                <p className="mt-3 font-medium">Select a ticket</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Choose a conversation from the list to read and reply.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-[360px] flex-col">
              <CardHeader className="space-y-3 border-b">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{selected.subject}</CardTitle>
                    <p className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                      <span className="inline-flex items-center gap-1">
                        <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
                        {selected.requester}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                        {selected.updatedAt}
                      </span>
                      <span>·</span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-medium',
                          PRIORITY_META[selected.priority].className,
                        )}
                      >
                        <CircleDot aria-hidden="true" className="h-3.5 w-3.5" />
                        {PRIORITY_META[selected.priority].label} priority
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={statusId}>Status</Label>
                    <Select
                      onValueChange={(value) => setStatus(value as TicketStatus)}
                      value={selected.status}
                    >
                      <SelectTrigger className="w-36" id={statusId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 p-4">
                <ul aria-label="Message thread" className="flex-1 space-y-3">
                  {selected.messages.map((message) => (
                    <li
                      className={cn(
                        'max-w-[90%] rounded-lg border p-3 text-sm',
                        message.role === 'agent'
                          ? 'ml-auto border-primary/20 bg-primary/5'
                          : 'bg-card',
                      )}
                      key={message.id}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium">{message.author}</span>
                        <span className="text-muted-foreground">{message.at}</span>
                      </div>
                      <p className="leading-relaxed">{message.body}</p>
                    </li>
                  ))}
                </ul>

                <form className="space-y-2 border-t pt-4" noValidate={true} onSubmit={sendReply}>
                  <Label htmlFor={replyId}>Reply</Label>
                  <Textarea
                    aria-describedby={
                      replyTouched && reply.trim().length < 2 ? replyErrorId : undefined
                    }
                    aria-invalid={replyTouched && reply.trim().length < 2}
                    id={replyId}
                    onBlur={() => setReplyTouched(true)}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Write a reply to the customer…"
                    rows={3}
                    value={reply}
                  />
                  {replyTouched && reply.trim().length < 2 ? (
                    <p className="text-destructive text-sm" id={replyErrorId}>
                      Write at least 2 characters before sending.
                    </p>
                  ) : null}
                  <Button type="submit">
                    <Send aria-hidden="true" className="h-4 w-4" /> Send reply
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — status filter, status change, and replies update
              the inbox live. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset support_tickets</code> for{' '}
                <code>support_tickets</code> and <code>support_ticket_messages</code>.
              </li>
              <li>
                <code>GET /api/support/tickets</code> lists tickets;{' '}
                <code>GET /api/support/tickets/:id/messages</code> loads the thread.
              </li>
              <li>
                Status select → <code>PATCH /api/support/tickets/:id</code> with{' '}
                <code>{'{ status }'}</code>.
              </li>
              <li>
                Send reply → <code>POST /api/support/tickets/:id/messages</code> with{' '}
                <code>{'{ body }'}</code>; keep the optimistic append shown here.
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
    <DemoTransitionStage defaultTransition="fade" title="Support motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
