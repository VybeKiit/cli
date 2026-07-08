import { Badge } from '@vybekiit/ui/badge';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileClock,
  FolderUp,
  Home,
  KanbanSquare,
  LifeBuoy,
  PackageSearch,
  PlugZap,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Named signed-in sections supported by the demo SaaS shell. */
export type DemoAppShellSection =
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'orders'
  | 'customers'
  | 'pipeline'
  | 'tasks'
  | 'calendar'
  | 'files'
  | 'teams'
  | 'billing'
  | 'support'
  | 'integrations'
  | 'notifications'
  | 'settings'
  | 'admin'
  | 'docs'
  | 'status'
  | 'changelog';

interface DemoAppShellProps {
  readonly active: DemoAppShellSection;
  readonly children: ReactNode;
  readonly eyebrow?: string;
  readonly title: string;
}

const navItems: ReadonlyArray<{
  readonly id: DemoAppShellSection;
  readonly label: string;
  readonly Icon: typeof Home;
}> = [
  { id: 'dashboard', label: 'Dashboard', Icon: Home },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'products', label: 'Products', Icon: PackageSearch },
  { id: 'orders', label: 'Orders', Icon: ShoppingCart },
  { id: 'customers', label: 'Customers', Icon: Users },
  { id: 'pipeline', label: 'Pipeline', Icon: KanbanSquare },
  { id: 'tasks', label: 'Tasks', Icon: ClipboardList },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'files', label: 'Files', Icon: FolderUp },
  { id: 'teams', label: 'Teams', Icon: UsersRound },
  { id: 'billing', label: 'Billing', Icon: CreditCard },
  { id: 'support', label: 'Support', Icon: LifeBuoy },
  { id: 'integrations', label: 'Integrations', Icon: PlugZap },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'admin', label: 'Admin', Icon: SlidersHorizontal },
  { id: 'docs', label: 'Docs', Icon: BookOpen },
  { id: 'status', label: 'Status', Icon: ShieldCheck },
  { id: 'changelog', label: 'Changelog', Icon: FileClock },
];

/**
 * Render a signed-in SaaS shell around a page recipe.
 *
 * @param props - Active section, title, optional eyebrow, and page body.
 * @returns A dashboard-style shell with sidebar navigation.
 * @example
 * const element = <DemoAppShell active="teams" title="Team">...</DemoAppShell>;
 */
export const DemoAppShell = ({
  active,
  children,
  eyebrow = 'Signed in',
  title,
}: DemoAppShellProps) => (
  <main className="min-h-screen bg-background text-foreground">
    <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r bg-card/80 lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold">VybeKiit SaaS</p>
            <p className="text-muted-foreground text-xs">Preview workspace</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map(({ id, label, Icon }) => (
            <a
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              href={`#${id}`}
              key={id}
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <Badge variant="secondary">{eyebrow}</Badge>
            <h1 className="mt-2 font-bold text-2xl tracking-tight md:text-3xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Demo user
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </section>
    </div>
  </main>
);
