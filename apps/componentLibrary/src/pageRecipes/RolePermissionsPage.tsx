import { LockKeyhole, Save, ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Roles',
    value: '6',
    detail: 'Owner to viewer',
    icon: <UserCog className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Permissions',
    value: '24',
    detail: 'Grouped by area',
    icon: <LockKeyhole className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Policies',
    value: '4',
    detail: 'Invite defaults',
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Members',
    value: '38',
    detail: 'Role-assigned',
    icon: <UsersRound className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const roleItems = [
  {
    title: 'Permissions matrix',
    description: 'Rows for capabilities and columns for roles.',
    badge: 'Matrix',
  },
  {
    title: 'Role editor',
    description: 'Rename roles, set defaults, and edit capability groups.',
    badge: 'Editor',
  },
  {
    title: 'Invite policy',
    description: 'Control who can invite and which role is default.',
    badge: 'Policy',
  },
] as const;

const roleControls = [
  {
    title: 'Require owner approval',
    description: 'Escalate risky role changes.',
    badge: 'Approval',
  },
  {
    title: 'Protect owner role',
    description: 'Prevent removing the last account owner.',
    badge: 'Owner',
  },
  {
    title: 'Audit permission edits',
    description: 'Record every role capability change.',
    badge: 'Audit',
  },
] as const;

/**
 * Render a source-backed role permissions page recipe.
 *
 * @returns A role and permissions matrix page.
 * @example
 * const element = <RolePermissionsPage />;
 */
export const RolePermissionsPage = () => {
  // TODO: Load roles and permissions from the configured authorization source.
  // TODO: Save role changes through audited authorization actions.
  return (
    <DemoQuickWinPage
      active="admin"
      badge="Roles"
      detailItems={roleControls}
      detailTitle="Permission safeguards"
      listDescription="A permissions matrix for owners, admins, editors, viewers, and custom roles."
      listItems={roleItems}
      listTitle="Role permissions"
      metrics={metrics}
      primaryAction={{ label: 'Save roles', icon: <Save className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Review policy',
        icon: <ShieldCheck className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A permissions page for role matrices, invite policy, owner protection, and audited authorization changes."
      title="Role permissions"
      transition="slide"
      variantDescription="Role pages need matrices, policy switches, and strong safeguards around owner access."
      variantItems={roleControls}
      variantTitle="Permission component variants"
    />
  );
};
