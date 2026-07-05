import { AdminUserTable } from '@/components/admin/admin-user-table';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your users, subscriptions, and access.</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Export CSV
        </button>
      </div>

      <AdminUserTable />
    </div>
  );
}
