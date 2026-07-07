import { AdminUserTable } from '@/components/admin/admin-user-table';

/**
 * Render the admin users dashboard.
 *
 * @returns User management shell with the mock table.
 * @example
 * <AdminUsersPage />
 */
const AdminUsersPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-bold text-2xl tracking-tight">Users</h2>
        <p className="text-muted-foreground">Manage your users, subscriptions, and access.</p>
      </div>
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
      >
        Export CSV
      </button>
    </div>

    <AdminUserTable />
  </div>
);

export default AdminUsersPage;
