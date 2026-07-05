export default function AdminTeamsPage() {
  // Mock data — wire to @vybekiit/tenancy
  const teams = [
    {
      id: '1',
      name: 'Acme Corp',
      plan: 'enterprise',
      members: 12,
      owner: 'alice@example.com',
      created: '2024-11-01',
    },
    {
      id: '2',
      name: 'Startup Inc',
      plan: 'pro',
      members: 5,
      owner: 'bob@example.com',
      created: '2025-01-15',
    },
    {
      id: '3',
      name: 'Design Studio',
      plan: 'pro',
      members: 3,
      owner: 'carol@example.com',
      created: '2025-03-20',
    },
    {
      id: '4',
      name: 'Dev Agency',
      plan: 'enterprise',
      members: 8,
      owner: 'dave@example.com',
      created: '2025-05-10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Teams & Organizations</h2>
        <p className="text-muted-foreground">Manage multi-tenant organizations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{team.name}</h3>
                <p className="text-sm text-muted-foreground">{team.owner}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  team.plan === 'enterprise'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}
              >
                {team.plan}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>👥 {team.members} members</span>
              <span>Created {team.created}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
