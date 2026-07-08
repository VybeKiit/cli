import { CalendarDays, Eye, Plus, RefreshCw, UsersRound } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Events',
    value: '18',
    detail: 'This week',
    icon: <CalendarDays className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Bookings',
    value: '6',
    detail: 'Pending confirm',
    icon: <UsersRound className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Reminders',
    value: '9',
    detail: 'Scheduled',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Conflicts',
    value: '1',
    detail: 'Needs action',
    icon: <Eye className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const calendarItems = [
  {
    title: 'Calendar grid',
    description: 'Month, week, day, and agenda-friendly event cards.',
    badge: 'Grid',
  },
  {
    title: 'Booking slots',
    description: 'Availability, timezone, and confirmation states.',
    badge: 'Booking',
  },
  {
    title: 'Reminders',
    description: 'Email, push, and in-app reminder preferences.',
    badge: 'Alerts',
  },
] as const;

const calendarControls = [
  {
    title: 'Create event',
    description: 'Title, time, guests, location, and notes.',
    badge: 'Create',
  },
  {
    title: 'Reschedule booking',
    description: 'Move events while preserving reminders.',
    badge: 'Move',
  },
  {
    title: 'Sync calendars',
    description: 'Show external calendar sync and error states.',
    badge: 'Sync',
  },
] as const;

/**
 * Render a source-backed calendar page recipe.
 *
 * @returns A calendar and booking page with event controls.
 * @example
 * const element = <CalendarPage />;
 */
export const CalendarPage = () => {
  // TODO: Load events, bookings, and reminders from the configured calendar source.
  // TODO: Save calendar changes through the configured calendar actions.
  return (
    <DemoQuickWinPage
      active="calendar"
      badge="Calendar"
      detailItems={calendarControls}
      detailTitle="Calendar controls"
      listDescription="Scheduling route for bookings, reminders, team calendars, and event-heavy apps."
      listItems={calendarItems}
      listTitle="Calendar workspace"
      metrics={metrics}
      primaryAction={{ label: 'Create event', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View agenda',
        icon: <CalendarDays className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A calendar page with event lists, booking slots, reminders, conflicts, and external sync states."
      title="Calendar"
      transition="scale"
      variantDescription="Calendar pages need clear dates, event density, booking states, and timezone-aware copy."
      variantItems={calendarControls}
      variantTitle="Calendar component variants"
    />
  );
};
