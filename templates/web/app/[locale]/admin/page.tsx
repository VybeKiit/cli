import { AdminStatsCard } from '@/components/admin/admin-stats-card';
import { AdminRevenueChart } from '@/components/admin/admin-revenue-chart';

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Your SaaS at a glance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Users"
          value="1,248"
          change="+12% this month"
          trend="up"
          icon="👥"
        />
        <AdminStatsCard title="MRR" value="$8,500" change="+18% this month" trend="up" icon="💰" />
        <AdminStatsCard
          title="Active Subscriptions"
          value="312"
          change="+8 this week"
          trend="up"
          icon="💳"
        />
        <AdminStatsCard
          title="Churn Rate"
          value="2.1%"
          change="-0.3% vs last month"
          trend="down"
          icon="📉"
        />
      </div>

      {/* Revenue chart */}
      <AdminRevenueChart />

      {/* Recent activity */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Recent Activity</h3>
        <div className="space-y-3 text-sm">
          {[
            { action: 'New signup', detail: 'eve@example.com', time: '2 min ago' },
            { action: 'Upgraded to Pro', detail: 'alice@example.com', time: '1 hour ago' },
            {
              action: 'Payment received',
              detail: '$49.00 from bob@example.com',
              time: '3 hours ago',
            },
            { action: 'New team created', detail: 'Acme Corp (5 members)', time: '5 hours ago' },
            { action: 'Support ticket', detail: '#1234 — Billing question', time: '1 day ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium">{item.action}</span>
                <span className="ml-2 text-muted-foreground">{item.detail}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
