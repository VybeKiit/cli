import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { UsersRound } from 'lucide-react';
import { useId } from 'react';

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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border bg-card p-5">
          <Badge className="mb-4" variant="secondary">
            Teams
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight">Invite your team</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            A compact team setup page for organizations, seats, roles, and invites.
          </p>
          <div className="mt-6 space-y-2">
            <Label htmlFor={inviteEmailId}>Invite email</Label>
            <Input defaultValue="teammate@example.com" id={inviteEmailId} />
            <Button className="w-full" type="button">
              Send invite
            </Button>
          </div>
        </aside>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <UsersRound className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-xl">Workspace members</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {['Owner', 'Editor', 'Viewer'].map((role) => (
              <div className="flex items-center justify-between rounded-lg border p-3" key={role}>
                <div>
                  <p className="font-medium">{role}</p>
                  <p className="text-muted-foreground text-sm">Default role row for setup.</p>
                </div>
                <Button size="sm" type="button" variant="outline">
                  Change
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
