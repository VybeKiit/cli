'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { IntegrationTodo } from '@/components/saas/integrationTodo';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { MailPlus, UserCog, UsersRound } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';

type MemberRole = 'Owner' | 'Admin' | 'Editor' | 'Viewer';

interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: MemberRole;
}

const ROLE_OPTIONS: readonly MemberRole[] = ['Owner', 'Admin', 'Editor', 'Viewer'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_MEMBERS: readonly TeamMember[] = [
  { id: '1', name: 'Maya Chen', email: 'maya@example.com', role: 'Owner' },
  { id: '2', name: 'Noah Green', email: 'noah@example.com', role: 'Editor' },
  { id: '3', name: 'Rina Fox', email: 'rina@example.com', role: 'Viewer' },
];

/**
 * Team invite + member management surface with local practice state.
 *
 * @returns The teams dashboard page.
 * @example
 * <TeamsPage />
 */
export const TeamsPage = () => {
  const inviteEmailId = useId();
  const [members, setMembers] = useState<readonly TeamMember[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('Editor');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState('');

  const sendInvite = (event: FormEvent) => {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (members.some((member) => member.email.toLowerCase() === email)) {
      setError('That person is already on the team.');
      return;
    }
    setError('');
    setPending(true);
    // TODO(vybekiit): POST invite via @vybekiit/tenancy — skill: add-teams
    globalThis.setTimeout(() => {
      const localPart = email.split('@')[0] ?? 'teammate';
      setMembers((current) => [
        ...current,
        {
          id: `invite-${email}`,
          name: localPart,
          email,
          role: inviteRole,
        },
      ]);
      setInviteEmail('');
      setPending(false);
      setFlash(`Invite sent to ${email}`);
    }, 600);
  };

  const changeRole = (id: string, role: MemberRole) => {
    // TODO(vybekiit): PATCH membership role — skill: add-teams
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, role } : member)),
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Invite teammates, assign roles, and manage workspace seats.
        </p>
      </header>

      {flash ? (
        <Alert variant="success">
          <AlertDescription>{flash}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <Badge className="w-fit" variant="secondary">
              Invite
            </Badge>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MailPlus aria-hidden="true" className="h-5 w-5" /> Add a teammate
            </CardTitle>
            <CardDescription>Send an email invite with a starting role.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={sendInvite}>
              <div className="space-y-2">
                <Label htmlFor={inviteEmailId}>Email</Label>
                <Input
                  id={inviteEmailId}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@example.com"
                  type="email"
                  value={inviteEmail}
                />
                {error ? <p className="text-destructive text-sm">{error}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  onValueChange={(value) => setInviteRole(value as MemberRole)}
                  value={inviteRole}
                >
                  <SelectTrigger>
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
              <Button className="w-full" disabled={pending} type="submit">
                {pending ? 'Sending…' : 'Send invite'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UsersRound aria-hidden="true" className="h-5 w-5" /> Workspace members
            </CardTitle>
            <CardDescription>{members.length} people in this workspace</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {members.map((member) => (
              <div
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center"
                key={member.id}
              >
                <div className="min-w-0">
                  <p className="font-medium">{member.name}</p>
                  <p className="truncate text-muted-foreground text-sm">{member.email}</p>
                </div>
                {member.role === 'Owner' ? (
                  <Badge className="justify-center" variant="outline">
                    Owner
                  </Badge>
                ) : (
                  <Select
                    onValueChange={(value) => changeRole(member.id, value as MemberRole)}
                    value={member.role}
                  >
                    <SelectTrigger aria-label={`Change role for ${member.name}`}>
                      <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
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
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <IntegrationTodo
        feature="teams"
        todos={[
          'Run vybekiit apply-preset organizations (skill: add-teams).',
          'POST invites through @vybekiit/tenancy → resolveTenancyProvider().',
          'Replace practice members with org membership queries.',
        ]}
      />
    </div>
  );
};
