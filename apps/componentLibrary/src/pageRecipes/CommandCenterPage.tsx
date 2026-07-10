'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { CheckCircle2, Command, Flag, Loader2, Pin, Search, UserPlus, Zap } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type CommandGroup = 'navigation' | 'create' | 'ops' | 'help';

/** One runnable command in the palette. */
type CommandItem = {
  readonly id: string;
  readonly label: string;
  readonly group: CommandGroup;
  readonly shortcut?: string;
  readonly keywords: readonly string[];
  readonly pinned?: boolean;
};

const GROUP_LABEL: Record<CommandGroup, string> = {
  navigation: 'Go to',
  create: 'Create',
  ops: 'Operations',
  help: 'Help',
};

const INITIAL_COMMANDS: readonly CommandItem[] = [
  {
    id: 'cmd_dashboard',
    label: 'Open dashboard',
    group: 'navigation',
    shortcut: 'G D',
    keywords: ['home', 'overview'],
    pinned: true,
  },
  {
    id: 'cmd_customers',
    label: 'Open customers',
    group: 'navigation',
    shortcut: 'G C',
    keywords: ['crm', 'accounts'],
  },
  {
    id: 'cmd_tasks',
    label: 'Open tasks',
    group: 'navigation',
    shortcut: 'G T',
    keywords: ['todo', 'board'],
  },
  {
    id: 'cmd_invite',
    label: 'Invite teammate',
    group: 'create',
    shortcut: 'N U',
    keywords: ['member', 'email'],
    pinned: true,
  },
  {
    id: 'cmd_task',
    label: 'Create task',
    group: 'create',
    shortcut: 'N T',
    keywords: ['todo', 'add'],
  },
  {
    id: 'cmd_flag',
    label: 'Toggle feature flag',
    group: 'ops',
    keywords: ['release', 'beta'],
  },
  {
    id: 'cmd_retry_jobs',
    label: 'Retry failed jobs',
    group: 'ops',
    keywords: ['queue', 'cron', 'job_runs'],
    pinned: true,
  },
  {
    id: 'cmd_health',
    label: 'Open system health',
    group: 'ops',
    keywords: ['uptime', 'status'],
  },
  {
    id: 'cmd_docs',
    label: 'Search docs',
    group: 'help',
    shortcut: '?',
    keywords: ['help', 'article'],
  },
  {
    id: 'cmd_support',
    label: 'Open support inbox',
    group: 'help',
    keywords: ['tickets', 'inbox'],
  },
];

/**
 * A production-shaped command center: live palette search, pin/unpin, recent history, and a run
 * action with a short busy state. Fully interactive with local state; plug-in panel maps ops
 * commands onto the job_runs preset where relevant.
 *
 * @returns The command center recipe element.
 * @example
 * const element = <CommandCenterPage />;
 */
export const CommandCenterPage = () => {
  // TODO: Load command definitions and recent actions from the configured command source (job_runs for ops).
  // TODO: Execute selected commands through audited command actions.
  const searchId = useId();

  const [commands, setCommands] = useState<readonly CommandItem[]>(INITIAL_COMMANDS);
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<readonly string[]>([
    'cmd_retry_jobs',
    'cmd_invite',
    'cmd_dashboard',
  ]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return commands;
    }
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group.includes(q) ||
        cmd.keywords.some((k) => k.includes(q)),
    );
  }, [commands, query]);

  const pinned = useMemo(() => commands.filter((c) => c.pinned), [commands]);
  const recent = useMemo(
    () =>
      recentIds
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is CommandItem => c !== undefined),
    [commands, recentIds],
  );

  const grouped = useMemo(() => {
    const map = new Map<CommandGroup, CommandItem[]>();
    for (const cmd of visible) {
      const list = map.get(cmd.group) ?? [];
      list.push(cmd);
      map.set(cmd.group, list);
    }
    return map;
  }, [visible]);

  const togglePin = (id: string) => {
    setCommands((current) =>
      current.map((cmd) => (cmd.id === id ? { ...cmd, pinned: !cmd.pinned } : cmd)),
    );
  };

  const runCommand = (cmd: CommandItem) => {
    setSelectedId(cmd.id);
    setRunningId(cmd.id);
    setNotice(null);
    globalThis.setTimeout(() => {
      setRunningId(null);
      setRecentIds((current) => [cmd.id, ...current.filter((id) => id !== cmd.id)].slice(0, 6));
      setNotice(`Ran “${cmd.label}”.`);
    }, 650);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Command
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Command center</h1>
          <p className="max-w-xl text-muted-foreground">
            Search actions, pin favorites, and run commands. Type “job” or “invite” to filter —
            clear the query to see groups again.
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

        <Card className="mb-4">
          <CardContent className="p-3 sm:p-4">
            <LabelSr htmlFor={searchId}>Search commands</LabelSr>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
              />
              <Input
                autoFocus={true}
                className="pl-9"
                id={searchId}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actions, pages, ops…"
                type="search"
                value={query}
              />
              <kbd className="-translate-y-1/2 absolute top-1/2 right-3 hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
                ⌘K
              </kbd>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi
            icon={<Command aria-hidden="true" className="h-4 w-4" />}
            label="Commands"
            value={String(commands.length)}
          />
          <Kpi
            icon={<Pin aria-hidden="true" className="h-4 w-4" />}
            label="Pinned"
            value={String(pinned.length)}
          />
          <Kpi
            icon={<Zap aria-hidden="true" className="h-4 w-4" />}
            label="Recent"
            value={String(recent.length)}
          />
        </div>

        {query.trim().length === 0 && recent.length > 0 ? (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2 pt-0 sm:p-3 sm:pt-0">
              {recent.map((cmd) => (
                <CommandRow
                  cmd={cmd}
                  key={`recent-${cmd.id}`}
                  onPin={() => togglePin(cmd.id)}
                  onRun={() => runCommand(cmd)}
                  running={runningId === cmd.id}
                  selected={selectedId === cmd.id}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-2 sm:p-3">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-14 text-center">
                <Search aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">No commands match</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Try “create”, “health”, or clear the search.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setQuery('')}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {([...grouped.entries()] as const).map(([group, items]) => (
                  <section aria-label={GROUP_LABEL[group]} key={group}>
                    <h2 className="mb-1 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      {GROUP_LABEL[group]}
                    </h2>
                    <ul className="space-y-0.5">
                      {items.map((cmd) => (
                        <li key={cmd.id}>
                          <CommandRow
                            cmd={cmd}
                            onPin={() => togglePin(cmd.id)}
                            onRun={() => runCommand(cmd)}
                            running={runningId === cmd.id}
                            selected={selectedId === cmd.id}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — search, pin, and run all update live. To make it
              real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Register navigation and create commands in a client catalog; keep ops commands
                server-backed.
              </li>
              <li>
                For queue/cron ops, run <code>vybekiit apply-preset job_runs</code> and map “Retry
                failed jobs” to <code>POST /api/admin/jobs/retry</code>.
              </li>
              <li>
                Persist pins + recent IDs per user (local storage is fine for demos; use user
                settings in production).
              </li>
              <li>
                Write every executed command to <code>audit_log</code> with actor and payload.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Visually hidden label for the search field. */
const LabelSr = ({
  htmlFor,
  children,
}: {
  readonly htmlFor: string;
  readonly children: ReactNode;
}) => (
  <label className="sr-only" htmlFor={htmlFor}>
    {children}
  </label>
);

/** One command row with run + pin. */
const CommandRow = ({
  cmd,
  onRun,
  onPin,
  running,
  selected,
}: {
  readonly cmd: CommandItem;
  readonly onRun: () => void;
  readonly onPin: () => void;
  readonly running: boolean;
  readonly selected: boolean;
}) => {
  let icon: ReactNode = <Zap aria-hidden="true" className="h-4 w-4" />;
  if (cmd.group === 'create') {
    icon = <UserPlus aria-hidden="true" className="h-4 w-4" />;
  } else if (cmd.group === 'ops') {
    icon = <Flag aria-hidden="true" className="h-4 w-4" />;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2',
        selected && 'bg-primary/5',
        'hover:bg-muted/60',
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        disabled={running}
        onClick={onRun}
        type="button"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {running ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-sm">{cmd.label}</span>
          <span className="block text-muted-foreground text-xs">{GROUP_LABEL[cmd.group]}</span>
        </span>
        {cmd.shortcut ? (
          <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
            {cmd.shortcut}
          </kbd>
        ) : null}
      </button>
      <Button
        aria-label={cmd.pinned ? `Unpin ${cmd.label}` : `Pin ${cmd.label}`}
        aria-pressed={Boolean(cmd.pinned)}
        onClick={onPin}
        size="icon"
        type="button"
        variant="ghost"
        className="h-8 w-8 shrink-0"
      >
        <Pin
          aria-hidden="true"
          className={cn(
            'h-4 w-4',
            cmd.pinned ? 'fill-current text-primary' : 'text-muted-foreground',
          )}
        />
      </Button>
    </div>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="scale" title="Command center motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** Small KPI tile. */
const Kpi = ({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) => (
  <Card>
    <CardContent className="flex items-center gap-2 p-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="font-semibold text-lg tabular-nums leading-none">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </CardContent>
  </Card>
);
