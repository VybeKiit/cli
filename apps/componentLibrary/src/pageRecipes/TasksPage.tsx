import { CheckSquare, ClipboardList, Filter, Plus, RefreshCw } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Tasks',
    value: '42',
    detail: 'Across projects',
    icon: <ClipboardList className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Due today',
    value: '8',
    detail: 'Needs focus',
    icon: <CheckSquare className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Blocked',
    value: '3',
    detail: 'Waiting on owner',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'rose',
  },
  {
    label: 'Completed',
    value: '64%',
    detail: 'This week',
    icon: <Filter className="h-5 w-5" />,
    tone: 'emerald',
  },
] as const;

const taskItems = [
  {
    title: 'Task list',
    description: 'Title, priority, assignee, due date, and status.',
    badge: 'List',
  },
  {
    title: 'Priority lanes',
    description: 'Today, upcoming, blocked, and done sections.',
    badge: 'Priority',
  },
  {
    title: 'Assignment states',
    description: 'Owner avatars, unassigned state, and handoff copy.',
    badge: 'Owner',
  },
] as const;

const taskControls = [
  {
    title: 'Create task',
    description: 'Quick add with title, owner, due date, and priority.',
    badge: 'Create',
  },
  {
    title: 'Bulk complete',
    description: 'Mark selected tasks complete with loading state.',
    badge: 'Bulk',
  },
  { title: 'Filter by owner', description: 'Personal and team task views.', badge: 'Filter' },
] as const;

/**
 * Render a source-backed tasks page recipe.
 *
 * @returns A task list page with priority and assignment controls.
 * @example
 * const element = <TasksPage />;
 */
export const TasksPage = () => {
  // TODO: Load tasks, assignees, and priorities from the configured task source.
  // TODO: Save task changes through the configured task actions.
  return (
    <DemoQuickWinPage
      active="tasks"
      badge="Tasks"
      detailItems={taskControls}
      detailTitle="Task controls"
      listDescription="A productivity route for internal apps, SaaS dashboards, and project tools."
      listItems={taskItems}
      listTitle="Task workspace"
      metrics={metrics}
      primaryAction={{ label: 'Add task', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Filter tasks',
        icon: <Filter className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A task management page with priorities, assignees, due dates, blocked states, and bulk actions."
      title="Tasks"
      transition="fade"
      variantDescription="Task pages need dense rows, priority indicators, and quick owner/date controls."
      variantItems={taskControls}
      variantTitle="Task component variants"
    />
  );
};
