'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@vybekiit/ui/empty';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { Separator } from '@vybekiit/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vybekiit/ui/tabs';
import { Textarea } from '@vybekiit/ui/textarea';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  MessageSquarePlus,
  Package,
  Phone,
  StickyNote,
  UserRound,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdCents } from '../shared/formatUsdCents';
import { InfoRow } from './InfoRow';

type TabId = 'overview' | 'notes' | 'orders';

/** One CRM note on the customer timeline. */
type Note = {
  readonly id: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: string;
};

/** A related order row for the orders tab. */
type RelatedOrder = {
  readonly id: string;
  readonly label: string;
  readonly amountCents: number;
  readonly status: 'paid' | 'refunded' | 'pending';
  readonly date: string;
};

const CUSTOMER = {
  id: 'cus_01',
  name: 'Aria Montgomery',
  email: 'aria@northwind.io',
  phone: '+1 (415) 555-0142',
  company: 'Northwind Labs',
  status: 'active' as const,
  owner: 'Maya Chen',
  plan: 'Scale',
  mrrCents: 24_900,
  seats: 12,
  since: '2025-03-14',
  health: 86,
};

const INITIAL_NOTES: readonly Note[] = [
  {
    id: 'n1',
    author: 'Maya Chen',
    body: 'Renewal call booked for next Tuesday. They want SSO before expanding seats.',
    createdAt: '2026-07-08 · 10:14',
  },
  {
    id: 'n2',
    author: 'Sam Ortiz',
    body: 'Passed health check — usage up 22% MoM on the API product.',
    createdAt: '2026-07-02 · 16:40',
  },
  {
    id: 'n3',
    author: 'Maya Chen',
    body: 'Introduced Aria to the customer success playbook; she shared it with her team.',
    createdAt: '2026-06-18 · 09:05',
  },
];

const ORDERS: readonly RelatedOrder[] = [
  {
    id: 'ord_4821',
    label: 'Scale annual · 12 seats',
    amountCents: 298_800,
    status: 'paid',
    date: '2026-03-14',
  },
  {
    id: 'ord_4012',
    label: 'Growth monthly · 5 seats',
    amountCents: 14_900,
    status: 'paid',
    date: '2025-11-02',
  },
  {
    id: 'ord_3880',
    label: 'Starter monthly · 1 seat',
    amountCents: 2900,
    status: 'refunded',
    date: '2025-03-14',
  },
];

const ORDER_STATUS: Record<
  RelatedOrder['status'],
  { readonly label: string; readonly className: string }
> = {
  paid: {
    label: 'Paid',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  refunded: {
    label: 'Refunded',
    className: 'border-border bg-muted text-muted-foreground',
  },
};

const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

/**
 * A production-shaped customer profile: overview metrics, a notes tab with a live add-note form,
 * and related orders. Notes append immediately with local state; empty notes shows a reachable empty
 * state. Plug-in panel maps onto the customers preset + customer_notes table.
 *
 * @returns The customer detail recipe element.
 * @example
 * const element = <CustomerDetailPage />;
 */
export const CustomerDetailPage = () => {
  // TODO: Load customer timeline, notes, and related orders from the customers preset tables.
  // TODO: Persist new notes through POST /api/customers/:id/notes.
  const noteFieldId = useId();
  const noteErrorId = useId();
  const noteLiveId = useId();
  const noteHeadingRef = useRef<HTMLHeadingElement>(null);

  const [tab, setTab] = useState<TabId>('overview');
  const [notes, setNotes] = useState<readonly Note[]>(INITIAL_NOTES);
  const [noteBody, setNoteBody] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [noteNotice, setNoteNotice] = useState<string | null>(null);

  const noteValid = noteBody.trim().length >= 3;

  const addNote = (event: FormEvent) => {
    event.preventDefault();
    setNoteTouched(true);
    if (!noteValid) {
      return;
    }
    const next: Note = {
      id: `n_${Date.now()}`,
      author: 'You',
      body: noteBody.trim(),
      createdAt: 'Just now',
    };
    setNotes((current) => [next, ...current]);
    setNoteBody('');
    setNoteTouched(false);
    setNoteNotice('Note saved.');
    setTab('notes');
    globalThis.setTimeout(() => noteHeadingRef.current?.focus(), 0);
  };

  const clearNotes = () => {
    setNotes([]);
    setNoteNotice('All notes cleared (demo).');
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Customer detail motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-lg text-primary"
            >
              {initials(CUSTOMER.name)}
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold text-3xl tracking-tight md:text-4xl">{CUSTOMER.name}</h1>
                <Badge
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  variant="outline"
                >
                  Active
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {CUSTOMER.company} · {CUSTOMER.plan} · Owner {CUSTOMER.owner}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="button" variant="outline">
              <Mail aria-hidden="true" className="h-4 w-4" /> Email
            </Button>
            <Button size="sm" type="button" variant="outline">
              <Phone aria-hidden="true" className="h-4 w-4" /> Call
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only" id={noteLiveId}>
          {noteNotice ?? ''}
        </p>

        <Tabs className="mt-8" onValueChange={(value) => setTab(value as TabId)} value={tab}>
          <TabsList aria-label="Customer sections">
            {(
              [
                { value: 'overview' as const, label: 'Overview' },
                { value: 'notes' as const, label: `Notes (${notes.length})` },
                { value: 'orders' as const, label: `Orders (${ORDERS.length})` },
              ] as const
            ).map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent className="mt-4 space-y-4" value="overview">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  {
                    key: 'mrr',
                    icon: <Building2 aria-hidden="true" className="h-4 w-4" />,
                    label: 'MRR',
                    value: formatUsdCents(CUSTOMER.mrrCents),
                  },
                  {
                    key: 'seats',
                    icon: <UserRound aria-hidden="true" className="h-4 w-4" />,
                    label: 'Seats',
                    value: String(CUSTOMER.seats),
                  },
                  {
                    key: 'customer-since',
                    icon: <Calendar aria-hidden="true" className="h-4 w-4" />,
                    label: 'Customer since',
                    value: 'Mar 2025',
                  },
                  {
                    key: 'health',
                    icon: <CheckCircle2 aria-hidden="true" className="h-4 w-4" />,
                    label: 'Health',
                    value: `${CUSTOMER.health}%`,
                    valueClassName: 'text-emerald-600',
                  },
                ] as const
              ).map(({ key, ...tile }) => (
                <Kpi key={key} {...tile} />
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={<Mail aria-hidden="true" className="h-4 w-4" />} label="Email">
                  {CUSTOMER.email}
                </InfoRow>
                <InfoRow icon={<Phone aria-hidden="true" className="h-4 w-4" />} label="Phone">
                  {CUSTOMER.phone}
                </InfoRow>
                <InfoRow
                  icon={<Building2 aria-hidden="true" className="h-4 w-4" />}
                  label="Company"
                >
                  {CUSTOMER.company}
                </InfoRow>
                <InfoRow icon={<UserRound aria-hidden="true" className="h-4 w-4" />} label="Owner">
                  {CUSTOMER.owner}
                </InfoRow>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base" ref={noteHeadingRef} tabIndex={-1}>
                  Add a note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" noValidate={true} onSubmit={addNote}>
                  <div className="space-y-1.5">
                    <Label htmlFor={noteFieldId}>Note</Label>
                    <Textarea
                      aria-describedby={noteTouched && !noteValid ? noteErrorId : undefined}
                      aria-invalid={noteTouched && !noteValid}
                      id={noteFieldId}
                      onBlur={() => setNoteTouched(true)}
                      onChange={(event) => setNoteBody(event.target.value)}
                      placeholder="What should the team know?"
                      rows={3}
                      value={noteBody}
                    />
                    {noteTouched && !noteValid ? (
                      <p className="text-destructive text-sm" id={noteErrorId}>
                        Write at least 3 characters.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">
                      <MessageSquarePlus aria-hidden="true" className="h-4 w-4" /> Save note
                    </Button>
                    {notes.length > 0 ? (
                      <Button onClick={clearNotes} type="button" variant="outline">
                        Clear all (demo)
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <Empty className="min-h-0 py-12" variant="dashed">
                <EmptyHeader>
                  <EmptyMedia>
                    <StickyNote aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No notes yet</EmptyTitle>
                  <EmptyDescription>
                    Add the first note so the team has context on this account.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul aria-label="Customer notes" className="space-y-3">
                {notes.map((note) => (
                  <li key={note.id}>
                    <Card>
                      <CardContent className="space-y-2 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-sm">{note.author}</p>
                          <p className="text-muted-foreground text-xs">{note.createdAt}</p>
                        </div>
                        <p className="text-sm leading-relaxed">{note.body}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent className="mt-4" value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package aria-hidden="true" className="h-4 w-4" /> Related orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {ORDERS.map((order, index) => (
                  <div key={order.id}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-sm">{order.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {order.id} · {order.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn('font-normal', ORDER_STATUS[order.status].className)}
                          variant="outline"
                        >
                          {ORDER_STATUS[order.status].label}
                        </Badge>
                        <span className="font-semibold text-sm tabular-nums">
                          {formatUsdCents(order.amountCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — tabs switch sections, and the notes form appends a
            live timeline entry (or clears to the empty state). To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset customers</code> (same preset as the customers list)
              for <code>customers</code> + <code>customer_notes</code>.
            </li>
            <li>
              Load the profile with <code>GET /api/customers/:id</code> and notes with{' '}
              <code>GET /api/customers/:id/notes</code>.
            </li>
            <li>
              On <b>Save note</b>, <code>POST /api/customers/:id/notes</code> with{' '}
              <code>{'{ body }'}</code>; keep the optimistic append shown here.
            </li>
            <li>
              Pull related orders from the shipped D1 <code>orders</code> ledger filtered by
              customer email (the checkout webhook already writes those rows).
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
