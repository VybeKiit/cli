'use client';

import { useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'banned' | 'pending';
  createdAt: string;
  lastLogin: string;
}

// Mock data — replace with @vybekiit/db queries
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'alice@example.com',
    name: 'Alice Chen',
    plan: 'pro',
    status: 'active',
    createdAt: '2024-12-01',
    lastLogin: '2025-07-04',
  },
  {
    id: '2',
    email: 'bob@example.com',
    name: 'Bob Smith',
    plan: 'enterprise',
    status: 'active',
    createdAt: '2024-11-15',
    lastLogin: '2025-07-03',
  },
  {
    id: '3',
    email: 'carol@example.com',
    name: 'Carol Davis',
    plan: 'free',
    status: 'active',
    createdAt: '2025-01-10',
    lastLogin: '2025-06-28',
  },
  {
    id: '4',
    email: 'dave@example.com',
    name: 'Dave Wilson',
    plan: 'pro',
    status: 'banned',
    createdAt: '2025-02-20',
    lastLogin: '2025-05-15',
  },
  {
    id: '5',
    email: 'eve@example.com',
    name: 'Eve Johnson',
    plan: 'free',
    status: 'pending',
    createdAt: '2025-07-01',
    lastLogin: '',
  },
];

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  banned: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

export function AdminUserTable() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const filtered = MOCK_USERS.filter((u) => {
    const matchesSearch =
      u.email.includes(search) || u.name.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Plan</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-left font-medium">Last Login</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_BADGE[user.plan]}`}
                  >
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[user.status]}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.createdAt}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.lastLogin || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs hover:bg-accent"
                      title="Impersonate"
                    >
                      👤
                    </button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs hover:bg-accent"
                      title={user.status === 'banned' ? 'Unban' : 'Ban'}
                    >
                      {user.status === 'banned' ? '✓' : '🚫'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
        )}
      </div>
    </div>
  );
}
