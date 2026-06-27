import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Placeholder stat cards — wired to real data by the `save-data` skill. */
const STATS = [
  { label: 'Users', value: '—' },
  { label: 'Revenue', value: '—' },
  { label: 'Active today', value: '—' },
];

/**
 * Minimal signed-in dashboard — pure layout. The route guard and real data are
 * marked stubs the agent wires next.
 *
 * TODO(vybekiit): protect this route — redirect to /login when there is no session — skill: add-signin
 * TODO(vybekiit): replace the placeholder stats with the builder's real data — skill: save-data
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-3">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>A few things you can ask your AI agent to do next.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
            <li>Add sign-in so people can log in.</li>
            <li>Add payments so you can charge for this.</li>
            <li>Put your app online with a custom domain.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
