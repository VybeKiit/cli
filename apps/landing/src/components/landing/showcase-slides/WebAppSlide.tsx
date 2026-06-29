'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Menu, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const RECENT = [
  { name: 'Alex M.', amount: '$48', status: 'Paid' },
  { name: 'Jordan K.', amount: '$99', status: 'Paid' },
  { name: 'Sam R.', amount: '$249', status: 'Pending' },
] as const;

const REVENUE_DATA = [
  { month: 'Jan', revenue: 4200, users: 820 },
  { month: 'Feb', revenue: 5100, users: 940 },
  { month: 'Mar', revenue: 4800, users: 910 },
  { month: 'Apr', revenue: 6200, users: 1080 },
  { month: 'May', revenue: 7100, users: 1184 },
  { month: 'Jun', revenue: 7800, users: 1284 },
] as const;

const NAV = ['Dashboard', 'Customers', 'Billing', 'Settings'] as const;

const chartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1, 217 91% 60%))' },
  users: { label: 'Users', color: 'hsl(var(--chart-2, 142 71% 45%))' },
} satisfies ChartConfig;

function NavList({ compact = false }: { readonly compact?: boolean }) {
  return (
    <>
      {NAV.map((item, index) => (
        <div
          className={cn(
            'mb-1 rounded-md px-2 py-1.5 text-[10px] transition-colors',
            index === 0
              ? 'bg-[var(--blue)]/10 font-semibold text-[var(--blue-strong)]'
              : 'text-[var(--light-muted)] hover:bg-black/5 hover:text-[var(--light-text)]',
            compact && 'whitespace-nowrap',
          )}
          key={item}
        >
          {item}
        </div>
      ))}
    </>
  );
}

/** Web App carousel slide — hover sidebar, sheet nav, recharts, shadcn polish. */
export function WebAppSlide() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-black/10 border-b bg-[#E8ECF2] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28CA42]" />
        <span className="ms-2 text-[11px] text-[var(--light-muted)]">app.yourproduct.com</span>
        <div className="ms-auto flex items-center gap-1 sm:hidden">
          <Sheet>
            <SheetTrigger asChild={true}>
              <Button className="h-6 w-6 hover:scale-105" size="icon" tabIndex={-1} variant="ghost">
                <Menu className="h-3.5 w-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[180px] p-3 sm:max-w-[180px]" side="left">
              <p className="mb-2 font-semibold text-[10px] text-[var(--light-text)]">Navigation</p>
              <NavList compact={true} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 bg-[var(--light-card)]">
        <aside
          className={cn(
            'group hidden shrink-0 border-black/6 border-e p-2 transition-[width] duration-300 sm:block',
            sidebarExpanded ? 'w-[34%]' : 'w-[22%]',
          )}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <NavList />
          <Separator className="my-2 bg-black/8" />
          <p className="px-2 text-[8px] text-[var(--light-muted)] opacity-0 transition-opacity group-hover:opacity-100">
            Hover to expand
          </p>
        </aside>

        <div className="min-w-0 flex-1 p-2">
          <div className="mb-2 flex items-center justify-between">
            <Tabs defaultValue="overview">
              <TabsList className="h-7 origin-start scale-90">
                <TabsTrigger className="text-[11px]" value="overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger className="text-[11px]" value="customers">
                  Customers
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="grid gap-2 lg:grid-cols-2">
                  <Card className="border-black/8 shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 p-2 pb-0">
                      <CardTitle className="text-[11px] text-[var(--light-text)]">
                        Revenue
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild={true}>
                          <Button className="h-6 w-6" size="icon" tabIndex={-1} variant="ghost">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[8rem]">
                          <DropdownMenuItem className="text-[10px]">Export CSV</DropdownMenuItem>
                          <DropdownMenuItem className="text-[10px]">Share report</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[var(--light-text)] text-lg">
                          <AnimatedNumber value="$24,880" />
                        </p>
                        <Badge className="text-[9px]" variant="secondary">
                          <AnimatedNumber value="+12.5%" />
                        </Badge>
                      </div>
                      {loadingChart ? (
                        <Skeleton className="mt-2 h-16 w-full bg-black/8" />
                      ) : (
                        <ChartContainer className="mt-1 h-16 w-full" config={chartConfig}>
                          <AreaChart
                            data={[...REVENUE_DATA]}
                            margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" hide={true} />
                            <YAxis hide={true} />
                            <ChartTooltip content={<ChartTooltipContent hideLabel={true} />} />
                            <Area
                              dataKey="revenue"
                              fill="var(--color-revenue)"
                              fillOpacity={0.25}
                              stroke="var(--color-revenue)"
                              strokeWidth={1.5}
                              type="monotone"
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-black/8 shadow-sm">
                    <CardHeader className="p-2 pb-0">
                      <CardTitle className="text-[10px] text-[var(--light-text)]">
                        Active Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <p className="font-bold text-[var(--light-text)] text-base">
                        <AnimatedNumber value="1,284" />
                      </p>
                      <p className="text-[9px] text-[var(--green)]">
                        <AnimatedNumber value="+8.2%" /> this week
                      </p>
                      <ChartContainer className="mt-1 h-14 w-full" config={chartConfig}>
                        <BarChart
                          data={[...REVENUE_DATA]}
                          margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                        >
                          <XAxis dataKey="month" hide={true} />
                          <YAxis hide={true} />
                          <Bar dataKey="users" fill="var(--color-users)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-2 rounded-md border border-black/6 p-2">
                  <p className="mb-1.5 font-semibold text-[9px] text-[var(--light-text)]">Recent</p>
                  {RECENT.map((row) => (
                    <div
                      className="flex justify-between text-[9px] text-[var(--light-muted)]"
                      key={row.name}
                    >
                      <span>{row.name}</span>
                      <span>
                        <AnimatedNumber value={row.amount} />{' '}
                        <Badge className="ms-1 scale-75 text-[8px]" variant="outline">
                          {row.status}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-2 h-6 origin-start scale-90 text-[9px]"
                  onClick={() => setLoadingChart((value) => !value)}
                  size="sm"
                  tabIndex={-1}
                  type="button"
                >
                  {loadingChart ? 'Show chart' : 'Refresh chart'}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
