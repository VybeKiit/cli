import { Badge } from '@vybekiit/ui/badge';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { MailPlus, ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { useId } from 'react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoAppShell } from './shared/DemoAppShell';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

const memberRows = [
  { name: 'Maya Chen', email: 'maya@example.com', role: 'Owner' },
  { name: 'Noah Green', email: 'noah@example.com', role: 'Editor' },
  { name: 'Rina Fox', email: 'rina@example.com', role: 'Viewer' },
];

const roleOptions = ['Owner', 'Admin', 'Editor', 'Viewer'] as const;

/**
 * Render a source-backed teams page recipe.
 *
 * @returns A ready team invite and member management page.
 * @example
 * const element = <TeamsPage />;
 */
export const TeamsPage = () => {
  const inviteEmailId = useId();

  // TODO: Load organizations and memberships from the active teams data model.
  // TODO: Send invite requests through the configured team invitation action.
  return (
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="slide" title="Teams motion pass">
        <DemoAppShell active="teams" title="Team settings">
          <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <aside className="rounded-lg border bg-card p-5">
              <Badge className="mb-4" variant="secondary">
                Teams
              </Badge>
              <h2 className="font-bold text-3xl tracking-tight">Invite your team</h2>
              <p className="mt-2 text-muted-foreground text-sm">
                A compact team setup page for organizations, seats, roles, and invites.
              </p>
              <div className="mt-6 space-y-2">
                <Label htmlFor={inviteEmailId}>Invite email</Label>
                <Input defaultValue="teammate@example.com" id={inviteEmailId} />
                <DemoActionButton className="w-full" icon={<MailPlus className="h-4 w-4" />}>
                  Send invite
                </DemoActionButton>
              </div>
            </aside>

            <div className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold text-xl">Workspace members</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {memberRows.map((member) => (
                  <div
                    className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"
                    key={member.email}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{member.name}</p>
                      <p className="truncate text-muted-foreground text-sm">{member.email}</p>
                    </div>
                    <Select defaultValue={member.role}>
                      <SelectTrigger aria-label={`Change role for ${member.name}`}>
                        <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <DemoVariantGrid
            className="mt-6"
            description="Role, invite, and permission cards keep the team UI scannable."
            title="Team component variants"
          >
            <DemoVariantCard label="Owner" tone="primary">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <p className="font-semibold">Full workspace access</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Large label, strong status color.
              </p>
            </DemoVariantCard>
            <DemoVariantCard label="Editor" tone="accent">
              <UserCog className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">Can update content</p>
              <p className="mt-1 text-muted-foreground text-sm">Balanced card for common roles.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Viewer" tone="muted">
              <UsersRound className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium text-sm">Read-only seat</p>
              <p className="mt-1 text-muted-foreground text-xs">Compact for dense member lists.</p>
            </DemoVariantCard>
          </DemoVariantGrid>
        </DemoAppShell>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
