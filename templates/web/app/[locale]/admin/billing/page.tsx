import { AdminStatsCard } from '@/components/admin/admin-stats-card';
import { AdminRevenueChart } from '@/components/admin/admin-revenue-chart';

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Revenue</h2>
        <p className="text-muted-foreground">Revenue metrics and subscription management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatsCard
          title="Monthly Revenue"
          value="$8,500"
          change="+$1,300 vs last month"
          trend="up"
          icon="💰"
        />
        <AdminStatsCard
          title="Annual Revenue"
          value="$102,000"
          change="Projected"
          trend="neutral"
          icon="📈"
        />
        <AdminStatsCard
          title="Avg Revenue/User"
          value="$27.24"
          change="+$2.10"
          trend="up"
          icon="🎯"
        />
      </div>

      <AdminRevenueChart />

      {/* Plan distribution */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Plan Distribution</h3>
        <div className="space-y-3">
          {[
            { plan: 'Free', users: 936, pct: 75, color: 'bg-gray-400' },
            { plan: 'Pro ($19/mo)', users: 249, pct: 20, color: 'bg-blue-500' },
            { plan: 'Enterprise ($99/mo)', users: 63, pct: 5, color: 'bg-purple-500' },
          ].map((p) => (
            <div key={p.plan} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{p.plan}</span>
                <span className="text-muted-foreground">
                  {p.users} users ({p.pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Recent Transactions</h3>
        <div className="space-y-2 text-sm">
          {[
            {
              user: 'alice@example.com',
              amount: '$49.00',
              plan: 'Pro',
              date: 'Jul 4, 2025',
              status: 'succeeded',
            },
            {
              user: 'bob@example.com',
              amount: '$99.00',
              plan: 'Enterprise',
              date: 'Jul 3, 2025',
              status: 'succeeded',
            },
            {
              user: 'carol@example.com',
              amount: '$49.00',
              plan: 'Pro',
              date: 'Jul 2, 2025',
              status: 'refunded',
            },
          ].map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
            >
              <div>
                <span className="font-medium">{tx.user}</span>
                <span className="ml-2 text-muted-foreground">→ {tx.plan}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={tx.status === 'refunded' ? 'text-red-500 line-through' : 'font-medium'}
                >
                  {tx.amount}
                </span>
                <span className="text-xs text-muted-foreground">{tx.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
