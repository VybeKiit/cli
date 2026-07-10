'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Skeleton } from '@vybekiit/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';
import {
  Loader2,
  LockKeyhole,
  MailPlus,
  RefreshCw,
  Search,
  UserCog,
  UsersRound,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';
type UserStatus = 'active' | 'invited' | 'suspended';
type StatusFilter = 'all' | UserStatus;
type LoadState = 'loading' | 'ready' | 'error';

/** One admin user row (mirrors organization_members-shaped fields). */
type ManagedUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly lastActive: string;
};

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const STATUS_META: Record<UserStatus, { readonly label: string; readonly className: string }> = {
  active: {
    label: 'Active',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  invited: {
    label: 'Invited',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
  },
  suspended: {
    label: 'Suspended',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
};

const STATUS_FILTERS: readonly { readonly value: StatusFilter; readonly label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

const INITIAL_USERS: readonly ManagedUser[] = [
  {
    id: 'u_01',
    name: 'Maya Chen',
    email: 'maya@example.com',
    role: 'owner',
    status: 'active',
    lastActive: 'Now',
  },
  {
    id: 'u_02',
    name: 'Sam Ortiz',
    email: 'sam@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '1h ago',
  },
  {
    id: 'u_03',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    role: 'editor',
    status: 'active',
    lastActive: '3h ago',
  },
  {
    id: 'u_04',
    name: 'Priya Nair',
    email: 'priya@orbit.app',
    role: 'viewer',
    status: 'invited',
    lastActive: 'Never',
  },
  {
    id: 'u_05',
    name: 'Noah Brooks',
    email: 'noah@fieldkit.co',
    role: 'editor',
    status: 'suspended',
    lastActive: '45d ago',
  },
  {
    id: 'u_06',
    name: 'Lee Park',
    email: 'lee@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '20m ago',
  },
  {
    id: 'u_07',
    name: 'Elena Vargas',
    email: 'elena@summit.mx',
    role: 'viewer',
    status: 'invited',
    lastActive: 'Never',
  },
  {
    id: 'u_08',
    name: 'Kenji Sato',
    email: 'kenji@pixel.jp',
    role: 'editor',
    status: 'active',
    lastActive: '2d ago',
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOAD_MS = 700;

const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

/**
 * A production-shaped admin user management page: search/status filters, role changes, suspend
 * and restore, invite form with validation, loading skeleton. Fully interactive with local state;
 * plug-in panel maps to the organizations preset.
 *
 * @returns The user management recipe element.
 * @example
 * const element = <UserManagementPage />;
 */
export const UserManagementPage = () => {
  // TODO: Load users, roles, and status from the organizations preset via GET /api/admin/users.
  // TODO: Persist invites, role changes, and suspend/restore through audited admin mutations.
  const searchId = useId();
  const filterId = useId();
  const inviteEmailId = useId();
  const inviteEmailErrorId = useId();
  const inviteRoleId = useId();
  const tableCaptionId = useId();

  const [users, setUsers] = useState<readonly ManagedUser[]>(INITIAL_USERS);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [inviteTouched, setInviteTouched] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const inviteValid = EMAIL_PATTERN.test(inviteEmail.trim());

  const runLoad = () => {
    setLoadState('loading');
    setNotice(null);
    globalThis.setTimeout(() => setLoadState('ready'), LOAD_MS);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: simulate the initial fetch once on mount.
  useEffect(() => {
    runLoad();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesQuery =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [users, query, statusFilter]);

  const kpis = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const invited = users.filter((u) => u.status === 'invited').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    return { total: users.length, active, invited, suspended };
  }, [users]);

  const setRole = (id: string, role: UserRole) => {
    const target = users.find((u) => u.id === id);
    if (target === undefined || target.role === 'owner') {
      if (target?.role === 'owner') {
        setNotice('Owner role cannot be changed from this table.');
      }
      return;
    }
    setUsers((current) => current.map((u) => (u.id === id ? { ...u, role } : u)));
    setNotice(`Updated ${target.name} to ${ROLE_LABEL[role]}.`);
  };

  const toggleSuspend = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target === undefined || target.role === 'owner') {
      if (target?.role === 'owner') {
        setNotice('Cannot suspend the account owner.');
      }
      return;
    }
    const nextStatus: UserStatus = target.status === 'suspended' ? 'active' : 'suspended';
    setUsers((current) => current.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)));
    setNotice(
      nextStatus === 'suspended' ? `Suspended ${target.name}.` : `Restored ${target.name}.`,
    );
  };

  const invite = (event: FormEvent) => {
    event.preventDefault();
    setInviteTouched(true);
    if (!inviteValid) {
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setNotice('That email is already on the workspace.');
      return;
    }
    setInviting(true);
    globalThis.setTimeout(() => {
      const next: ManagedUser = {
        id: `u_${Date.now()}`,
        name: email.split('@')[0] ?? 'Invitee',
        email,
        role: inviteRole,
        status: 'invited',
        lastActive: 'Never',
      };
      setUsers((current) => [next, ...current]);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteTouched(false);
      setInviting(false);
      setStatusFilter('all');
      setQuery('');
      setNotice(`Invite sent to ${email}.`);
    }, 700);
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  let tableBody: ReactNode;
  if (loadState === 'loading') {
    tableBody = (
      <div className="space-y-3" role="status">
        <span className="sr-only">Loading users</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`sk-${String(index)}`} />
        ))}
      </div>
    );
  } else if (visible.length === 0) {
    tableBody = (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <Search aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 font-semibold text-lg">No users match</h2>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">
          Try a different name or clear the status filter.
        </p>
        <Button className="mt-4" onClick={clearFilters} type="button" variant="outline">
          Clear filters
        </Button>
      </div>
    );
  } else {
    tableBody = (
      <div className="overflow-x-auto">
        <Table aria-labelledby={tableCaptionId}>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Last active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs"
                    >
                      {initials(user.name)}
                    </span>
                    <span>
                      <span className="block font-medium">{user.name}</span>
                      <span className="block text-muted-foreground text-xs">{user.email}</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.role === 'owner' ? (
                    <Badge variant="secondary">{ROLE_LABEL.owner}</Badge>
                  ) : (
                    <Select
                      onValueChange={(value) => setRole(user.id, value as UserRole)}
                      value={user.role}
                    >
                      <SelectTrigger
                        aria-label={`Change role for ${user.name}`}
                        className="h-8 w-[120px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['admin', 'editor', 'viewer'] as const).map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn('font-normal', STATUS_META[user.status].className)}
                    variant="outline"
                  >
                    {STATUS_META[user.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground text-sm md:table-cell">
                  {user.lastActive}
                </TableCell>
                <TableCell className="text-right">
                  {user.role === 'owner' ? (
                    <span className="text-muted-foreground text-xs">Protected</span>
                  ) : (
                    <Button
                      onClick={() => toggleSuspend(user.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {user.status === 'suspended' ? 'Restore' : 'Suspend'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Admin users
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">User management</h1>
            <p className="max-w-xl text-muted-foreground">
              Search members, change roles, suspend accounts, and send invites. Owner rows stay
              protected.
            </p>
          </div>
          <Button
            disabled={loadState === 'loading'}
            onClick={runLoad}
            type="button"
            variant="outline"
          >
            {loadState === 'loading' ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 text-sm">
            {notice}
          </div>
        ) : null}

        <section aria-label="User metrics" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={<UsersRound aria-hidden="true" className="h-4 w-4" />}
            label="Total"
            value={String(kpis.total)}
          />
          <Kpi
            icon={<UserCog aria-hidden="true" className="h-4 w-4" />}
            label="Active"
            value={String(kpis.active)}
          />
          <Kpi
            icon={<MailPlus aria-hidden="true" className="h-4 w-4" />}
            label="Invited"
            value={String(kpis.invited)}
          />
          <Kpi
            icon={<LockKeyhole aria-hidden="true" className="h-4 w-4" />}
            label="Suspended"
            value={String(kpis.suspended)}
            valueClassName={kpis.suspended > 0 ? 'text-amber-600' : undefined}
          />
        </section>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Invite user</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              noValidate={true}
              onSubmit={invite}
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={inviteEmailId}>Email</Label>
                <Input
                  aria-describedby={inviteTouched && !inviteValid ? inviteEmailErrorId : undefined}
                  aria-invalid={inviteTouched && !inviteValid}
                  autoComplete="email"
                  id={inviteEmailId}
                  onBlur={() => setInviteTouched(true)}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@example.com"
                  type="email"
                  value={inviteEmail}
                />
                {inviteTouched && !inviteValid ? (
                  <p className="text-destructive text-sm" id={inviteEmailErrorId}>
                    Enter a valid email address.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:w-40">
                <Label htmlFor={inviteRoleId}>Role</Label>
                <Select
                  onValueChange={(value) => setInviteRole(value as UserRole)}
                  value={inviteRole}
                >
                  <SelectTrigger id={inviteRoleId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['admin', 'editor', 'viewer'] as const).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={inviting} type="submit">
                {inviting ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <MailPlus aria-hidden="true" className="h-4 w-4" />
                )}
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base" id={tableCaptionId}>
                Members
              </CardTitle>
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {loadState === 'ready'
                  ? `Showing ${visible.length} of ${users.length}`
                  : 'Loading users…'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-64">
                <Label htmlFor={searchId}>Search</Label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    className="pl-9"
                    id={searchId}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, email, role…"
                    type="search"
                    value={query}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:w-44">
                <Label htmlFor={filterId}>Status</Label>
                <Select
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  value={statusFilter}
                >
                  <SelectTrigger id={filterId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>{tableBody}</CardContent>
        </Card>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — search, filters, invite, role changes, and
              suspend all update the table. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset organizations</code> for <code>organizations</code>{' '}
                and <code>organization_members</code>.
              </li>
              <li>
                <code>GET /api/admin/users?status=&amp;q=</code> lists members; map{' '}
                <code>role</code> and a status derived from invite / ban flags.
              </li>
              <li>
                Invite → <code>POST /api/admin/users/invite</code>; role →{' '}
                <code>PATCH /api/admin/users/:id</code>; suspend → ban flag + session revoke.
              </li>
              <li>
                Write every access change to <code>audit_log</code> and never demote or suspend the
                last Owner.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="slide" title="User management motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** One KPI tile. */
const Kpi = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string;
}) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className={cn('font-semibold text-lg tabular-nums', valueClassName)}>{value}</p>
      </div>
    </CardContent>
  </Card>
);
