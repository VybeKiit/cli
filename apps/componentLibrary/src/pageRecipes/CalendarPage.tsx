'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Plus } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

/** One calendar event (mirrors calendar_events). `day` is 1–31 in the demo month. */
type CalEvent = {
  readonly id: string;
  readonly title: string;
  readonly day: number;
  readonly time: string;
  readonly location: string;
  readonly color: string;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Fixed demo month: July 2026 (starts on Wednesday). */
const MONTH_LABEL = 'July 2026';
const YEAR = 2026;
const MONTH_INDEX = 6; // July
const DAYS_IN_MONTH = 31;
const START_WEEKDAY = 3; // Wednesday

const INITIAL_EVENTS: readonly CalEvent[] = [
  {
    id: 'ev_01',
    title: 'Sprint planning',
    day: 7,
    time: '10:00',
    location: 'Zoom',
    color: 'bg-blue-500',
  },
  {
    id: 'ev_02',
    title: 'Customer call · Aria',
    day: 8,
    time: '14:30',
    location: 'Meet',
    color: 'bg-violet-500',
  },
  {
    id: 'ev_03',
    title: 'Design critique',
    day: 10,
    time: '11:00',
    location: 'Studio',
    color: 'bg-amber-500',
  },
  {
    id: 'ev_04',
    title: 'Launch dry-run',
    day: 15,
    time: '09:00',
    location: 'HQ',
    color: 'bg-emerald-500',
  },
  {
    id: 'ev_05',
    title: 'Billing review',
    day: 15,
    time: '16:00',
    location: 'Zoom',
    color: 'bg-rose-500',
  },
  {
    id: 'ev_06',
    title: 'Team offsite half-day',
    day: 22,
    time: '13:00',
    location: 'Pier 15',
    color: 'bg-sky-500',
  },
  {
    id: 'ev_07',
    title: 'Investor update',
    day: 28,
    time: '15:00',
    location: 'Board room',
    color: 'bg-indigo-500',
  },
];

const EVENT_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
] as const;

/**
 * A production-shaped month calendar: grid with event dots, day selection that lists that day's
 * events, and an add-event form that pins onto the selected day. Empty days show a real empty
 * state. Plug-in panel maps onto the calendar_events preset.
 *
 * @returns The calendar recipe element.
 * @example
 * const element = <CalendarPage />;
 */
export const CalendarPage = () => {
  // TODO: Load events and attendees from the calendar_events preset tables.
  // TODO: Persist new events through POST /api/calendar/events.
  const titleId = useId();
  const timeId = useId();
  const locationId = useId();
  const titleErrorId = useId();

  const [events, setEvents] = useState<readonly CalEvent[]>(INITIAL_EVENTS);
  const [selectedDay, setSelectedDay] = useState(15);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const cells = useMemo(() => {
    const leading = Array.from({ length: START_WEEKDAY }, () => null as number | null);
    const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);
    return [...leading, ...days];
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalEvent[]>();
    for (const event of events) {
      const list = map.get(event.day) ?? [];
      list.push(event);
      map.set(event.day, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [events]);

  const dayEvents = eventsByDay.get(selectedDay) ?? [];
  const titleValid = title.trim().length >= 2;

  const addEvent = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!titleValid) {
      return;
    }
    const next: CalEvent = {
      id: `ev_${Date.now()}`,
      title: title.trim(),
      day: selectedDay,
      time: time || '09:00',
      location: location.trim() || 'TBD',
      color: EVENT_COLORS[events.length % EVENT_COLORS.length] ?? 'bg-blue-500',
    };
    setEvents((current) => [...current, next]);
    setTitle('');
    setLocation('');
    setTime('09:00');
    setTouched(false);
    setNotice(`Added “${next.title}” on ${MONTH_LABEL.split(' ')[0]} ${selectedDay}.`);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Productivity
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Calendar</h1>
            <p className="max-w-xl text-muted-foreground">
              Click a day to see its events, then add one with the form. Dots on the grid update
              live.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1">
            <Button
              aria-label="Previous month (demo fixed)"
              disabled={true}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </Button>
            <span className="min-w-[7rem] text-center font-medium text-sm">{MONTH_LABEL}</span>
            <Button
              aria-label="Next month (demo fixed)"
              disabled={true}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-muted-foreground text-xs">
                {WEEKDAYS.map((day) => (
                  <div className="py-1 font-medium" key={day}>
                    {day}
                  </div>
                ))}
              </div>
              <div
                aria-label={`${MONTH_LABEL} calendar`}
                className="grid grid-cols-7 gap-1"
                role="grid"
              >
                {cells.map((day, index) => {
                  if (day === null) {
                    return <div className="aspect-square" key={`pad-${String(index)}`} />;
                  }
                  const dayList = eventsByDay.get(day) ?? [];
                  const isSelected = selectedDay === day;
                  const isToday = day === 10; // demo "today" marker
                  return (
                    <button
                      aria-label={`${day} July, ${dayList.length} events`}
                      aria-selected={isSelected}
                      className={cn(
                        'flex aspect-square flex-col items-center rounded-lg border p-1 text-sm transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:bg-muted',
                        isToday && !isSelected && 'border-primary/40',
                      )}
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      role="gridcell"
                      type="button"
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full font-medium',
                          isToday && 'bg-primary text-primary-foreground',
                        )}
                      >
                        {day}
                      </span>
                      <span className="mt-0.5 flex max-w-full flex-wrap justify-center gap-0.5">
                        {dayList.slice(0, 3).map((ev) => (
                          <span
                            aria-hidden="true"
                            className={cn('h-1.5 w-1.5 rounded-full', ev.color)}
                            key={ev.id}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {MONTH_LABEL.split(' ')[0]} {selectedDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayEvents.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-3 py-8 text-center">
                    <p className="font-medium text-sm">No events</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Add one below for this day.
                    </p>
                  </div>
                ) : (
                  <ul aria-label="Events for selected day" className="space-y-2">
                    {dayEvents.map((ev) => (
                      <li className="rounded-lg border p-3" key={ev.id}>
                        <div className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', ev.color)}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{ev.title}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                              <span className="inline-flex items-center gap-1">
                                <Clock aria-hidden="true" className="h-3 w-3" />
                                {ev.time}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin aria-hidden="true" className="h-3 w-3" />
                                {ev.location}
                              </span>
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Add event</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" noValidate={true} onSubmit={addEvent}>
                  <div className="space-y-1.5">
                    <Label htmlFor={titleId}>Title</Label>
                    <Input
                      aria-describedby={touched && !titleValid ? titleErrorId : undefined}
                      aria-invalid={touched && !titleValid}
                      id={titleId}
                      onBlur={() => setTouched(true)}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Meeting title"
                      value={title}
                    />
                    {touched && !titleValid ? (
                      <p className="text-destructive text-sm" id={titleErrorId}>
                        Enter at least 2 characters.
                      </p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={timeId}>Time</Label>
                      <Input
                        id={timeId}
                        onChange={(event) => setTime(event.target.value)}
                        type="time"
                        value={time}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={locationId}>Location</Label>
                      <Input
                        id={locationId}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Zoom / room"
                        value={location}
                      />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Adds to <span className="font-medium text-foreground">July {selectedDay}</span>{' '}
                    (demo month is fixed at {YEAR}-{String(MONTH_INDEX + 1).padStart(2, '0')}).
                  </p>
                  <Button type="submit">
                    <Plus aria-hidden="true" className="h-4 w-4" /> Add event
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — day selection lists events, and the form appends
              onto the selected day with live dots on the grid. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset calendar_events</code> for{' '}
                <code>calendar_events</code> and <code>calendar_event_attendees</code>.
              </li>
              <li>
                <code>GET /api/calendar/events?from=&amp;to=</code> loads the visible range (
                <code>starts_at</code> / <code>ends_at</code> timestamptz).
              </li>
              <li>
                Add form → <code>POST /api/calendar/events</code> with{' '}
                <code>{'{ title, startsAt, endsAt, location }'}</code>.
              </li>
              <li>
                Enable month navigation by swapping the fixed demo month for real date math and
                re-fetching on range change.
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
    <DemoTransitionStage defaultTransition="scale" title="Calendar motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
