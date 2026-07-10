'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Switch } from '@vybekiit/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';
import { CheckCircle2, Loader2, LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type RoleId = 'owner' | 'admin' | 'editor' | 'viewer';

/** One capability row in the permissions matrix. */
type Permission = {
  readonly id: string;
  readonly label: string;
  readonly group: string;
};

const ROLES: readonly { readonly id: RoleId; readonly label: string }[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'admin', label: 'Admin' },
  { id: 'editor', label: 'Editor' },
  { id: 'viewer', label: 'Viewer' },
];

const PERMISSIONS: readonly Permission[] = [
  { id: 'billing.manage', label: 'Manage billing', group: 'Billing' },
  { id: 'members.invite', label: 'Invite members', group: 'Team' },
  { id: 'members.roles', label: 'Change roles', group: 'Team' },
  { id: 'content.write', label: 'Edit content', group: 'Content' },
  { id: 'content.publish', label: 'Publish content', group: 'Content' },
  { id: 'keys.manage', label: 'Manage API keys', group: 'Security' },
  { id: 'audit.view', label: 'View audit log', group: 'Security' },
  { id: 'settings.write', label: 'Edit workspace settings', group: 'Settings' },
];

/** Default matrix — owner has everything; viewer is read-oriented. */
const INITIAL_MATRIX: Record<RoleId, ReadonlySet<string>> = {
  owner: new Set(PERMISSIONS.map((p) => p.id)),
  admin: new Set([
    'members.invite',
    'members.roles',
    'content.write',
    'content.publish',
    'keys.manage',
    'audit.view',
    'settings.write',
  ]),
  editor: new Set(['content.write', 'content.publish', 'members.invite']),
  viewer: new Set(['audit.view']),
};

/**
 * A production-shaped role permissions matrix: toggle capabilities per role, protect owner
 * billing rights, invite-policy switch, and save with dirty state. Fully interactive with local
 * state; plug-in panel maps to the organizations preset roles.
 *
 * @returns The role permissions recipe element.
 * @example
 * const element = <RolePermissionsPage />;
 */
export const RolePermissionsPage = () => {
  // TODO: Load roles and permission grants from the organizations preset / authz store.
  // TODO: Persist role matrix and invite policy through audited authorization mutations.
  const invitePolicyId = useId();
  const tableCaptionId = useId();

  const [matrix, setMatrix] = useState<Record<RoleId, Set<string>>>(() => ({
    owner: new Set(INITIAL_MATRIX.owner),
    admin: new Set(INITIAL_MATRIX.admin),
    editor: new Set(INITIAL_MATRIX.editor),
    viewer: new Set(INITIAL_MATRIX.viewer),
  }));
  const [inviteRequiresAdmin, setInviteRequiresAdmin] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleId>('admin');

  const counts = useMemo(() => {
    const result = {} as Record<RoleId, number>;
    for (const role of ROLES) {
      result[role.id] = matrix[role.id].size;
    }
    return result;
  }, [matrix]);

  const hasPermission = (role: RoleId, permissionId: string): boolean =>
    matrix[role].has(permissionId);

  const togglePermission = (role: RoleId, permissionId: string) => {
    // Owner billing and role changes stay locked — prevent locking yourself out.
    if (
      role === 'owner' &&
      (permissionId === 'billing.manage' || permissionId === 'members.roles')
    ) {
      setNotice('Owner billing and role-change rights cannot be removed.');
      return;
    }
    setMatrix((current) => {
      const next = new Set(current[role]);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return { ...current, [role]: next };
    });
    setDirty(true);
    setNotice(null);
  };

  const save = () => {
    setSaving(true);
    setNotice(null);
    globalThis.setTimeout(() => {
      setSaving(false);
      setDirty(false);
      setNotice('Role permissions saved. Changes are audited.');
    }, 800);
  };

  const reset = () => {
    setMatrix({
      owner: new Set(INITIAL_MATRIX.owner),
      admin: new Set(INITIAL_MATRIX.admin),
      editor: new Set(INITIAL_MATRIX.editor),
      viewer: new Set(INITIAL_MATRIX.viewer),
    });
    setInviteRequiresAdmin(true);
    setDirty(false);
    setNotice('Reset to defaults.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Roles
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Role permissions</h1>
            <p className="max-w-xl text-muted-foreground">
              Toggle capabilities per role. Owner billing and role-change rights stay protected.
              Save writes an audit entry in a real app.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} type="button" variant="outline">
              Reset
            </Button>
            <Button disabled={!dirty || saving} onClick={save} type="button">
              {saving ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              Save roles
            </Button>
          </div>
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

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => (
            <button
              aria-pressed={selectedRole === role.id}
              className={cn(
                'rounded-lg border bg-card p-3 text-left transition-colors',
                selectedRole === role.id && 'border-primary bg-primary/5',
              )}
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              type="button"
            >
              <p className="font-semibold text-2xl tabular-nums">{counts[role.id]}</p>
              <p className="text-muted-foreground text-xs">{role.label} permissions</p>
            </button>
          ))}
        </div>

        <Card className="mb-4">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Invite policy
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                When on, only Admin and Owner can send invites (default Editor invite is off).
              </p>
            </div>
            <Switch
              aria-label="Require admin to invite"
              checked={inviteRequiresAdmin}
              id={invitePolicyId}
              onCheckedChange={(value) => {
                setInviteRequiresAdmin(value);
                setDirty(true);
              }}
            />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" id={tableCaptionId}>
              <LockKeyhole aria-hidden="true" className="h-4 w-4" /> Permissions matrix
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Highlighted column: {ROLES.find((r) => r.id === selectedRole)?.label}. Click a cell
              switch to grant or revoke.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table aria-labelledby={tableCaptionId}>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Capability</TableHead>
                  {ROLES.map((role) => (
                    <TableHead
                      className={cn(
                        'text-center',
                        selectedRole === role.id && 'bg-primary/5 text-primary',
                      )}
                      key={role.id}
                    >
                      {role.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSIONS.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{permission.label}</p>
                      <p className="text-muted-foreground text-xs">{permission.group}</p>
                    </TableCell>
                    {ROLES.map((role) => {
                      const on = hasPermission(role.id, permission.id);
                      const locked =
                        role.id === 'owner' &&
                        (permission.id === 'billing.manage' || permission.id === 'members.roles');
                      return (
                        <TableCell
                          className={cn('text-center', selectedRole === role.id && 'bg-primary/5')}
                          key={`${role.id}-${permission.id}`}
                        >
                          <div className="flex justify-center">
                            <Switch
                              aria-label={`${on ? 'Revoke' : 'Grant'} ${permission.label} for ${role.label}`}
                              checked={on}
                              disabled={locked}
                              onCheckedChange={() => togglePermission(role.id, permission.id)}
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {dirty ? (
          <p className="mt-3 text-amber-600 text-sm">You have unsaved permission changes.</p>
        ) : null}

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — matrix toggles, invite policy, and save all work
              offline. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset organizations</code> for orgs +{' '}
                <code>organization_members.role</code>.
              </li>
              <li>
                Store the capability matrix as config or a <code>role_permissions</code> table;
                evaluate grants server-side on every admin route.
              </li>
              <li>
                <code>PUT /api/admin/roles</code> saves the matrix; always append to{' '}
                <code>audit_log</code> with actor and diff.
              </li>
              <li>
                Never allow removing the last Owner or revoking Owner billing/role rights from the
                UI or API.
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
    <DemoTransitionStage defaultTransition="slide" title="Role permissions motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
