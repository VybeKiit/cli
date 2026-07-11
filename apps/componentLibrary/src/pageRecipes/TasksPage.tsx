'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { CheckCircle2, Circle, ListTodo, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type TaskStatus = 'todo' | 'doing' | 'done';
type Priority = 'low' | 'normal' | 'high';
type StatusFilter = 'all' | TaskStatus;

/** One task row (mirrors the tasks preset). */
type Task = {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly priority: Priority;
  readonly due: string;
  readonly assignee: string;
};

const PRIORITY_META: Record<Priority, { readonly label: string; readonly className: string }> = {
  low: { label: 'Low', className: 'text-muted-foreground' },
  normal: { label: 'Normal', className: 'border-border text-foreground' },
  high: {
    label: 'High',
    className: 'border-red-500/40 bg-red-500/10 text-red-600',
  },
};

/** Priority options for the create-task select (labels from PRIORITY_META). */
const PRIORITY_OPTIONS = Object.keys(PRIORITY_META) as readonly Priority[];

const STATUS_FILTERS: readonly { readonly value: StatusFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'Doing' },
  { value: 'done', label: 'Done' },
];

const INITIAL_TASKS: readonly Task[] = [
  {
    id: 'task_01',
    title: 'Ship webhook retry UI',
    status: 'doing',
    priority: 'high',
    due: 'Today',
    assignee: 'Maya',
  },
  {
    id: 'task_02',
    title: 'Write onboarding email copy',
    status: 'todo',
    priority: 'normal',
    due: 'Tomorrow',
    assignee: 'Sam',
  },
  {
    id: 'task_03',
    title: 'Fix Safari checkout hang',
    status: 'todo',
    priority: 'high',
    due: 'Today',
    assignee: 'Jordan',
  },
  {
    id: 'task_04',
    title: 'Review Q3 pipeline forecast',
    status: 'todo',
    priority: 'normal',
    due: 'Fri',
    assignee: 'Lee',
  },
  {
    id: 'task_05',
    title: 'Publish changelog v1.4.2',
    status: 'done',
    priority: 'low',
    due: 'Mon',
    assignee: 'Maya',
  },
  {
    id: 'task_06',
    title: 'Invite design contractor',
    status: 'doing',
    priority: 'normal',
    due: 'Wed',
    assignee: 'Sam',
  },
  {
    id: 'task_07',
    title: 'Archive churned Fieldkit notes',
    status: 'done',
    priority: 'low',
    due: 'Last week',
    assignee: 'Lee',
  },
];

/**
 * A production-shaped task list: complete toggle, status filter, add-task form with validation,
 * and delete. Completing every visible task (or filtering to nothing) reaches a real empty state.
 * Plug-in panel maps onto the tasks preset.
 *
 * @returns The tasks recipe element.
 * @example
 * const element = <TasksPage />;
 */
export const TasksPage = () => {
  // TODO: Load tasks, assignees, and priorities from the tasks preset tables.
  // TODO: Persist task create, complete, and status changes through task mutations.
  const titleId = useId();
  const titleErrorId = useId();
  const priorityId = useId();
  const filterLabelId = useId();

  const [tasks, setTasks] = useState<readonly Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('normal');
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.status === filter)),
    [tasks, filter],
  );

  const counts = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === 'todo').length,
      doing: tasks.filter((t) => t.status === 'doing').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks],
  );

  const titleValid = newTitle.trim().length >= 2;

  const toggleComplete = (id: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) {
          return task;
        }
        const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
        return { ...task, status: nextStatus };
      }),
    );
  };

  const removeTask = (id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
    setNotice('Task removed.');
  };

  const addTask = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!titleValid) {
      return;
    }
    const next: Task = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      status: 'todo',
      priority: newPriority,
      due: 'Soon',
      assignee: 'You',
    };
    setTasks((current) => [next, ...current]);
    setNewTitle('');
    setNewPriority('normal');
    setTouched(false);
    setNotice('Task added.');
    setFilter('all');
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Tasks motion pass">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Productivity
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Tasks</h1>
          <p className="max-w-xl text-muted-foreground">
            Check items off, filter by status, or add a new task. Counts update live.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              { key: 'to-do', label: 'To do', value: counts.todo },
              { key: 'doing', label: 'Doing', value: counts.doing },
              { key: 'done', label: 'Done', value: counts.done },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Add task</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              noValidate={true}
              onSubmit={addTask}
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={titleId}>Title</Label>
                <Input
                  aria-describedby={touched && !titleValid ? titleErrorId : undefined}
                  aria-invalid={touched && !titleValid}
                  id={titleId}
                  onBlur={() => setTouched(true)}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="What needs doing?"
                  value={newTitle}
                />
                {touched && !titleValid ? (
                  <p className="text-destructive text-sm" id={titleErrorId}>
                    Enter at least 2 characters.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:w-36">
                <Label htmlFor={priorityId}>Priority</Label>
                <Select
                  onValueChange={(value) => setNewPriority(value as Priority)}
                  value={newPriority}
                >
                  <SelectTrigger id={priorityId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {PRIORITY_META[value].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">
                <Plus aria-hidden="true" className="h-4 w-4" /> Add
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm" id={filterLabelId}>
            Show
          </span>
          <SegmentedControl
            aria-labelledby={filterLabelId}
            onValueChange={(value) => setFilter(value as typeof filter)}
            value={filter}
          >
            {STATUS_FILTERS.map((option) => (
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
                <ListTodo aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">No tasks here</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {filter === 'all'
                    ? 'Add a task above to get started.'
                    : 'Nothing matches this status — try All.'}
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
              <ul aria-label="Task list" className="divide-y">
                {visible.map((task) => {
                  const done = task.status === 'done';
                  return (
                    <li className="flex items-start gap-3 px-2 py-3 sm:items-center" key={task.id}>
                      <Checkbox
                        aria-label={
                          done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`
                        }
                        checked={done}
                        className="mt-1 sm:mt-0"
                        onCheckedChange={() => toggleComplete(task.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'font-medium text-sm',
                            done && 'text-muted-foreground line-through',
                          )}
                        >
                          {task.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                          <span>{task.assignee}</span>
                          <span>·</span>
                          <span>Due {task.due}</span>
                          <Badge
                            className={cn('font-normal', PRIORITY_META[task.priority].className)}
                            variant="outline"
                          >
                            {PRIORITY_META[task.priority].label}
                          </Badge>
                          {task.status === 'doing' ? (
                            <Badge className="font-normal" variant="secondary">
                              Doing
                            </Badge>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {done ? (
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Button
                          aria-label={`Delete ${task.title}`}
                          onClick={() => removeTask(task.id)}
                          size="icon"
                          type="button"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — complete toggles, filters, add, and delete all
            recompute the list. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset tasks</code> for <code>task_lists</code> and{' '}
              <code>tasks</code>.
            </li>
            <li>
              <code>GET /api/tasks?status=</code> loads rows; map <code>status</code> to{' '}
              <code>todo</code> / <code>doing</code> / <code>done</code>.
            </li>
            <li>
              Checkbox → <code>PATCH /api/tasks/:id</code> with <code>{'{ status: "done" }'}</code>{' '}
              (or back to <code>todo</code>).
            </li>
            <li>
              Add form → <code>POST /api/tasks</code> with{' '}
              <code>{'{ title, priority, listId }'}</code>; delete →{' '}
              <code>DELETE /api/tasks/:id</code>.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
