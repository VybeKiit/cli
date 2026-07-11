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
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { MailPlus, ShieldCheck, Trash2, UserCog, UsersRound } from 'lucide-react';
import { type FormEvent, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type Role = 'Owner' | 'Admin' | 'Editor' | 'Viewer';
type MemberStatus = 'active' | 'invited';

/** One workspace member or pending invite (mirrors organizations preset). */
type Member = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly status: MemberStatus;
};

const ROLE_OPTIONS: readonly Role[] = ['Owner', 'Admin', 'Editor', 'Viewer'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_MEMBERS: readonly Member[] = [
  {
    id: 'mem_01',
    name: 'Maya Chen',
    email: 'maya@example.com',
    role: 'Owner',
    status: 'active',
  },
  {
    id: 'mem_02',
    name: 'Noah Green',
    email: 'noah@example.com',
    role: 'Editor',
    status: 'active',
  },
  {
    id: 'mem_03',
    name: 'Rina Fox',
    email: 'rina@example.com',
    role: 'Viewer',
    status: 'active',
  },
  {
    id: 'mem_04',
    name: 'Pending invite',
    email: 'alex@studio.io',
    role: 'Editor',
    status: 'invited',
  },
];

const ROLE_META: Record<Role, { readonly className: string }> = {
  Owner: { className: 'border-amber-500/30 bg-amber-500/10 text-amber-700' },
  Admin: { className: 'border-blue-500/30 bg-blue-500/10 text-blue-600' },
  Editor: { className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' },
  Viewer: { className: 'border-border bg-muted text-muted-foreground' },
};

/**
 * Interactive teams page: invite with validation, role changes, remove, status filter.
 * Plug-in panel maps onto the organizations preset.
 *
 * @returns The teams recipe element.
 * @example
 * const element = <TeamsPage />;
 */
export const TeamsPage = () => {
  // TODO: Load organizations and memberships from the active teams data model.
  // TODO: Send invite requests through the configured team invitation action.
  const inviteEmailId = useId();
  const inviteRoleId = useId();
  const emailErrorId = useId();

  const [members, setMembers] = useState<readonly Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Viewer');
  const [touched, setTouched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const emailValid = EMAIL_PATTERN.test(inviteEmail.trim());

  const visible = useMemo(
    () =>
      statusFilter === 'all' ? members : members.filter((member) => member.status === statusFilter),
    [members, statusFilter],
  );

  const counts = useMemo(
    () => ({
      active: members.filter((member) => member.status === 'active').length,
      invited: members.filter((member) => member.status === 'invited').length,
    }),
    [members],
  );

  const sendInvite = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!emailValid) {
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (members.some((member) => member.email.toLowerCase() === email)) {
      setNotice('That person is already on the team.');
      return;
    }
    setSending(true);
    globalThis.setTimeout(() => {
      const next: Member = {
        id: `mem_${Date.now()}`,
        name: 'Pending invite',
        email,
        role: inviteRole,
        status: 'invited',
      };
      setMembers((current) => [next, ...current]);
      setInviteEmail('');
      setInviteRole('Viewer');
      setTouched(false);
      setSending(false);
      setStatusFilter('all');
      setNotice(`Invite sent to ${email}.`);
    }, 650);
  };

  const changeRole = (id: string, role: Role) => {
    setMembers((current) =>
      current.map((member) => {
        if (member.id !== id) {
          return member;
        }
        if (member.role === 'Owner' && role !== 'Owner') {
          const owners = current.filter((row) => row.role === 'Owner').length;
          if (owners <= 1) {
            setNotice('Keep at least one owner on the workspace.');
            return member;
          }
        }
        return { ...member, role };
      }),
    );
  };

  const removeMember = (id: string) => {
    const target = members.find((member) => member.id === id);
    if (!target) {
      return;
    }
    if (target.role === 'Owner') {
      const owners = members.filter((member) => member.role === 'Owner').length;
      if (owners <= 1) {
        setNotice('Cannot remove the last owner.');
        return;
      }
    }
    setMembers((current) => current.filter((member) => member.id !== id));
    setNotice(`${target.email} removed.`);
  };

  return (
    <DemoRecipeFrame defaultTransition="slide" title="Teams motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Teams
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Team settings</h1>
          <p className="max-w-xl text-muted-foreground">
            Invite teammates, change roles, and filter active vs pending seats.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              { key: 'active', label: 'Active', value: counts.active },
              { key: 'invited', label: 'Invited', value: counts.invited },
              { key: 'seats', label: 'Seats', value: members.length },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MailPlus aria-hidden="true" className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Invite your team</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" noValidate={true} onSubmit={sendInvite}>
                <div className="space-y-1.5">
                  <Label htmlFor={inviteEmailId}>Invite email</Label>
                  <Input
                    aria-describedby={touched && !emailValid ? emailErrorId : undefined}
                    aria-invalid={touched && !emailValid}
                    id={inviteEmailId}
                    onBlur={() => setTouched(true)}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    type="email"
                    value={inviteEmail}
                  />
                  {touched && !emailValid ? (
                    <p className="text-destructive text-sm" id={emailErrorId}>
                      Enter a valid email address.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={inviteRoleId}>Role</Label>
                  <Select
                    onValueChange={(value) => setInviteRole(value as Role)}
                    value={inviteRole}
                  >
                    <SelectTrigger id={inviteRoleId}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.filter((role) => role !== 'Owner').map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" disabled={sending} type="submit">
                  <MailPlus aria-hidden="true" className="h-4 w-4" />
                  {sending ? 'Sending…' : 'Send invite'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <UsersRound aria-hidden="true" className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Workspace members</CardTitle>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['all', 'active', 'invited'] as const).map((value) => (
                  <button
                    aria-pressed={statusFilter === value}
                    className={cn(
                      'rounded-md border px-2.5 py-1 font-medium text-xs capitalize transition-colors',
                      statusFilter === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              {visible.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <UsersRound aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No members here</EmptyTitle>
                    <EmptyDescription>
                      {statusFilter === 'all'
                        ? 'Invite someone to fill this workspace.'
                        : 'Nothing matches this status — try All.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    {statusFilter === 'all' ? null : (
                      <Button
                        onClick={() => setStatusFilter('all')}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Show all
                      </Button>
                    )}
                  </EmptyContent>
                </Empty>
              ) : (
                <ul aria-label="Team members" className="divide-y">
                  {visible.map((member) => (
                    <li
                      className="flex flex-col gap-3 px-2 py-3 sm:flex-row sm:items-center"
                      key={member.id}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-xs">
                          {member.status === 'invited'
                            ? '?'
                            : member.name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-sm">{member.name}</p>
                            {member.status === 'invited' ? (
                              <Badge className="font-normal" variant="secondary">
                                Invited
                              </Badge>
                            ) : null}
                            {member.role === 'Owner' ? (
                              <ShieldCheck
                                aria-label="Owner"
                                className="h-3.5 w-3.5 text-amber-600"
                              />
                            ) : null}
                          </div>
                          <p className="truncate text-muted-foreground text-xs">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:w-auto">
                        <Select
                          onValueChange={(value) => changeRole(member.id, value as Role)}
                          value={member.role}
                        >
                          <SelectTrigger
                            aria-label={`Change role for ${member.name}`}
                            className="w-[140px]"
                          >
                            <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge
                          className={cn(
                            'hidden font-normal sm:inline-flex',
                            ROLE_META[member.role].className,
                          )}
                          variant="outline"
                        >
                          {member.role}
                        </Badge>
                        <Button
                          aria-label={`Remove ${member.email}`}
                          onClick={() => removeMember(member.id)}
                          size="icon"
                          type="button"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — invite validation, role changes, and remove all
            recompute seats. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset organizations</code> for orgs, memberships, and
              invites.
            </li>
            <li>
              Load memberships from the active teams data model via{' '}
              <code>GET /api/team/members</code>.
            </li>
            <li>
              Send invite → configured team invitation action (<code>POST /api/team/invites</code>{' '}
              with <code>{'{ email, role }'}</code>).
            </li>
            <li>
              Role select → <code>PATCH /api/team/members/:id</code>; keep the last-owner guard.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
