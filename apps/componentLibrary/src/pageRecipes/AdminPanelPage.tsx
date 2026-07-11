import { Avatar, AvatarFallback } from '@vybekiit/ui/avatar';
import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Progress } from '@vybekiit/ui/progress';
import { Separator } from '@vybekiit/ui/separator';
import { Switch } from '@vybekiit/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vybekiit/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CreditCard,
  Database,
  FileClock,
  LifeBuoy,
  LockKeyhole,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoAppShell } from './shared/DemoAppShell';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';
import { DemoVariantCard } from './shared/DemoVariantCard';
import { DemoVariantGrid } from './shared/DemoVariantGrid';

const adminMetrics = [
  {
    label: 'Users',
    value: '1,284',
    detail: '+42 this week',
    Icon: UsersRound,
    className: 'text-blue-600',
  },
  {
    label: 'Billing risk',
    value: '7',
    detail: 'Needs review',
    Icon: CreditCard,
    className: 'text-amber-600',
  },
  {
    label: 'Open tickets',
    value: '18',
    detail: '4 high priority',
    Icon: LifeBuoy,
    className: 'text-violet-600',
  },
  {
    label: 'Audit events',
    value: '342',
    detail: 'Last 24 hours',
    Icon: FileClock,
    className: 'text-emerald-600',
  },
];

const userRows = [
  { name: 'Maya Chen', email: 'maya@example.com', plan: 'Growth', status: 'Owner' },
  { name: 'Noah Green', email: 'noah@example.com', plan: 'Starter', status: 'Trial' },
  { name: 'Rina Fox', email: 'rina@example.com', plan: 'Scale', status: 'Support' },
];

const auditRows = [
  'Role changed for Noah Green',
  'Invoice retry scheduled',
  'Feature flag enabled for beta dashboard',
  'Support ticket escalated',
];

const componentStack = [
  'BundUI app sidebar',
  'Untitled table',
  'EvilCharts health metric',
  'Kibo search glimpse',
  'Magic UI movement',
  'shadcnblocks admin cards',
];

/**
 * Render a source-backed admin panel page recipe.
 *
 * @returns A combined admin control center page for owners and operators.
 * @example
 * const element = <AdminPanelPage />;
 */
export const AdminPanelPage = () => {
  // TODO: Load users, plans, tickets, and admin events from the configured admin data sources.
  // TODO: Save admin actions through audited server actions.
  return (
    <DemoRecipeFrame defaultTransition="scale" title="Admin motion pass">
      <DemoAppShell active="admin" eyebrow="Owner console" title="Admin command center">
        <section className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge className="mb-4" variant="secondary">
                Admin
              </Badge>
              <p className="max-w-3xl text-muted-foreground">
                One operational surface for users, organizations, billing risk, support, audit
                events, and release controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DemoActionButton icon={<Search className="h-4 w-4" />} variant="outline">
                Search users
              </DemoActionButton>
              <DemoActionButton icon={<AlertTriangle className="h-4 w-4" />}>
                Review queue
              </DemoActionButton>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {adminMetrics.map(({ Icon, className, detail, label, value }) => (
              <Card className="rounded-lg" key={label}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardDescription>{label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
                  </div>
                  <Icon className={`h-5 w-5 ${className}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Workspace operations</CardTitle>
                <CardDescription>
                  Combined table, tabs, badges, and audit states from the shared UI library.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="users">
                  <TabsList className="grid w-full grid-cols-3">
                    {(
                      [
                        { value: 'users', label: 'Users' },
                        { value: 'billing', label: 'Billing' },
                        { value: 'audit', label: 'Audit log' },
                      ] as const
                    ).map(({ value, label }) => (
                      <TabsTrigger key={value} value={value}>
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="users">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {(
                            [
                              { key: 'user', label: 'User' },
                              { key: 'plan', label: 'Plan' },
                              { key: 'status', label: 'Status' },
                            ] as const
                          ).map(({ key, label }) => (
                            <TableHead key={key}>{label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userRows.map((user) => (
                          <TableRow key={user.email}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-muted-foreground text-xs">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.plan}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="billing">
                    <div className="space-y-4 rounded-lg border p-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="font-medium">Failed payment queue</p>
                          <Badge variant="outline">7 accounts</Badge>
                        </div>
                        <Progress value={68} />
                      </div>
                      <Separator />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border p-3">
                          <p className="font-semibold">Revenue recovery</p>
                          <p className="text-muted-foreground text-sm">
                            Retry reminders and plan downgrade handoff.
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="font-semibold">Plan exceptions</p>
                          <p className="text-muted-foreground text-sm">
                            Manual credits, refunds, and account notes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="audit">
                    <div className="grid gap-3">
                      {auditRows.map((event) => (
                        <div className="flex items-center gap-3 rounded-lg border p-3" key={event}>
                          <Activity className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm">{event}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LockKeyhole className="h-5 w-5 text-rose-600" />
                    Admin safeguards
                  </CardTitle>
                  <CardDescription>Default controls for privileged operations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Require two-step approval', 'Log destructive actions', 'Notify owner'].map(
                    (label, index) => (
                      <div className="flex items-center justify-between gap-3" key={label}>
                        <span className="text-sm">{label}</span>
                        <Switch defaultChecked={index !== 0} />
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Combined component stack
                  </CardTitle>
                  <CardDescription>
                    Admin pulls from the supported recipe library catalog.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {componentStack.map((item) => (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm" key={item}>
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <DemoVariantGrid
            description="A control center needs dense tables, risk cards, switches, and audit rows to compose cleanly."
            title="Admin component variants"
          >
            <DemoVariantCard label="Security" tone="primary">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <p className="font-semibold">Privileged actions</p>
              <p className="mt-1 text-muted-foreground text-sm">Strong status treatment.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Risk" tone="accent">
              <AlertTriangle className="mb-2 h-5 w-5 text-amber-600" />
              <p className="font-medium">Billing review</p>
              <p className="mt-1 text-muted-foreground text-sm">Warm warning tone.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Activity" tone="muted">
              <FileClock className="mb-2 h-5 w-5 text-emerald-600" />
              <p className="font-medium text-sm">Audit trace</p>
              <p className="mt-1 text-muted-foreground text-xs">Compact event row.</p>
            </DemoVariantCard>
          </DemoVariantGrid>
        </section>
      </DemoAppShell>
    </DemoRecipeFrame>
  );
};
