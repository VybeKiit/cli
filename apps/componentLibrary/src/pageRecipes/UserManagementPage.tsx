import { LockKeyhole, Plus, Search, UserCog, UsersRound } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Users',
    value: '1.2k',
    detail: 'Across workspaces',
    icon: <UsersRound className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Invites',
    value: '18',
    detail: 'Pending acceptance',
    icon: <Plus className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Suspended',
    value: '4',
    detail: 'Needs review',
    icon: <LockKeyhole className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Roles',
    value: '6',
    detail: 'Editable policies',
    icon: <UserCog className="h-5 w-5" />,
    tone: 'emerald',
  },
] as const;

const userItems = [
  {
    title: 'User table',
    description: 'Search, role, plan, status, and last-active columns.',
    badge: 'Table',
  },
  {
    title: 'Invite controls',
    description: 'Invite by email, assign role, and resend invitation.',
    badge: 'Invite',
  },
  {
    title: 'Suspend or restore',
    description: 'Privileged account actions with review states.',
    badge: 'Access',
  },
] as const;

const userControls = [
  {
    title: 'Role change audit',
    description: 'Log every role update to the audit trail.',
    badge: 'Audit',
  },
  {
    title: 'Bulk actions',
    description: 'Select users and apply status changes safely.',
    badge: 'Bulk',
  },
  {
    title: 'Support impersonation',
    description: 'Make impersonation explicit and time-limited.',
    badge: 'Support',
  },
] as const;

/**
 * Render a source-backed user management admin page recipe.
 *
 * @returns An admin users table with role and access controls.
 * @example
 * const element = <UserManagementPage />;
 */
export const UserManagementPage = () => {
  // TODO: Load users, roles, and account status from the configured admin user source.
  // TODO: Save user access changes through audited admin actions.
  return (
    <DemoQuickWinPage
      active="admin"
      badge="Admin users"
      detailItems={userControls}
      detailTitle="Access controls"
      listDescription="Admin user management for roles, support access, invites, and account status."
      listItems={userItems}
      listTitle="User management"
      metrics={metrics}
      primaryAction={{ label: 'Invite user', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search users',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A user management page for admins to search users, assign roles, suspend accounts, and review support access."
      title="User management"
      transition="slide"
      variantDescription="User admin pages need dense tables, bulk states, role badges, and clear destructive controls."
      variantItems={userControls}
      variantTitle="User management variants"
    />
  );
};
