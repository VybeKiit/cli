'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

const NOTIFICATIONS = [
  { title: 'Payment received', time: '2m' },
  { title: 'New signup', time: '8m' },
  { title: 'Report ready', time: '14m' },
] as const;

const SPARK_DATA = [
  { day: 'M', value: 12 },
  { day: 'T', value: 18 },
  { day: 'W', value: 15 },
  { day: 'T', value: 22 },
  { day: 'F', value: 28 },
  { day: 'S', value: 24 },
  { day: 'S', value: 30 },
] as const;

const chartConfig = {
  value: { label: 'Volume', color: 'hsl(217 91% 60%)' },
} satisfies ChartConfig;

/** Mobile App carousel slide — phone frame with recharts sparkline and tabs. */
export function MobileAppSlide() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--bg-card-deep)] p-2">
      <div className="flex h-full max-h-[420px] w-full max-w-[220px] flex-col rounded-[28px] border-[#1a1a1a] border-[3px] bg-[#0a0a0a] p-2 shadow-xl">
        <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-white/20" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-[var(--bg-card-deep)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-[11px] text-white">Dashboard</p>
            <Badge className="text-[9px]" variant="outline">
              Live
            </Badge>
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[9px] text-[var(--text-muted)]">Total Volume</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-1">
              <p className="font-bold text-sm text-white">
                <AnimatedNumber value="$24,880" />
              </p>
              <p className="text-[8px] text-[var(--green)]">
                <AnimatedNumber value="+12.5%" />
              </p>
              <ChartContainer className="mt-1 h-10 w-full" config={chartConfig}>
                <AreaChart data={[...SPARK_DATA]} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <XAxis dataKey="day" hide={true} />
                  <YAxis hide={true} />
                  <Area
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.2}
                    stroke="var(--color-value)"
                    strokeWidth={1.5}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Tabs className="mt-2" defaultValue="overview">
            <TabsList className="grid h-7 w-full grid-cols-3">
              <TabsTrigger className="text-[8px]" value="overview">
                Overview
              </TabsTrigger>
              <TabsTrigger className="text-[8px]" value="revenue">
                Revenue
              </TabsTrigger>
              <TabsTrigger className="text-[8px]" value="growth">
                Growth
              </TabsTrigger>
            </TabsList>
            <TabsContent className="mt-2" value="overview">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-md bg-white/5 p-1.5">
                  <p className="text-[7px] text-[var(--text-faint)]">Users</p>
                  <p className="font-bold text-[10px] text-white">
                    <AnimatedNumber value="842" />
                  </p>
                </div>
                <div className="rounded-md bg-white/5 p-1.5">
                  <p className="text-[7px] text-[var(--text-faint)]">MRR</p>
                  <p className="font-bold text-[10px] text-white">
                    <AnimatedNumber value="$4.2k" />
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-2 bg-white/10" />

          <p className="font-semibold text-[8px] text-[var(--text-muted)]">Notifications</p>
          <ul className="mt-1 flex-1 space-y-1 overflow-hidden">
            {NOTIFICATIONS.map((n) => (
              <li
                className="flex items-center justify-between rounded bg-white/5 px-1.5 py-1"
                key={n.title}
              >
                <span className="text-[8px] text-white">{n.title}</span>
                <span className="text-[7px] text-[var(--text-faint)]">{n.time}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col items-center gap-2 border-white/10 border-t pt-2">
            <div className="flex items-center gap-2">
              <img
                alt=""
                aria-hidden
                className="h-5 w-auto opacity-90"
                height={20}
                src="/brand-marks/appstore.webp"
                width={20}
              />
              <img
                alt=""
                aria-hidden
                className="h-5 w-auto opacity-90"
                height={20}
                src="/brand-marks/googleplay.webp"
                width={20}
              />
            </div>
            <div className="flex w-full justify-around">
              {['Home', 'Stats', 'Settings'].map((icon, i) => (
                <div
                  className={`text-[7px] ${i === 0 ? 'text-[var(--blue-soft)]' : 'text-[var(--text-faint)]'}`}
                  key={icon}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
