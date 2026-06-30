'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ACTIONS = ['Summarize page', 'Extract data', 'Generate reply', 'Translate'] as const;

const HISTORY = [
  'Summarized article on pricing',
  'Extracted 12 table rows',
  'Drafted support reply',
] as const;

/** Browser Extension carousel slide — tabbed popup with actions and history. */
export function ExtensionSlide() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-white/15 bg-[#0d1117] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            alt=""
            aria-hidden={true}
            height={16}
            src="/brand-marks/googlechrome.webp"
            width={16}
          />
          <p className="font-semibold text-sm text-white">VybeKiit Assistant</p>
        </div>
        <Badge
          className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[9px] text-[var(--green)]"
          variant="outline"
        >
          Online
        </Badge>
      </div>

      <Tabs defaultValue="ask">
        <TabsList className="mb-2 h-7 w-full">
          <TabsTrigger className="text-[10px]" value="ask">
            Ask
          </TabsTrigger>
          <TabsTrigger className="text-[10px]" value="actions">
            Actions
          </TabsTrigger>
          <TabsTrigger className="text-[10px]" value="history">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ask">
          <Input
            className="h-8 border-white/15 bg-white/5 text-white text-xs placeholder:text-white/40"
            placeholder="Ask anything..."
            readOnly={true}
            tabIndex={-1}
          />
          <div className="mt-2 space-y-1">
            <Skeleton className="h-3 w-3/4 bg-white/10" />
            <Skeleton className="h-3 w-1/2 bg-white/10" />
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <ul className="grid grid-cols-2 gap-1.5">
            {ACTIONS.map((action) => (
              <li key={action}>
                <Button
                  className="h-7 w-full justify-start border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/10"
                  tabIndex={-1}
                  variant="outline"
                >
                  {action}
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="history">
          <ul className="space-y-1">
            {HISTORY.map((item) => (
              <li
                className="flex items-start gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[10px] text-[var(--text-soft)]"
                key={item}
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--blue)]" />
                {item === 'Extracted 12 table rows' ? (
                  <>
                    Extracted <AnimatedNumber value="12" /> table rows
                  </>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <Separator className="my-2 bg-white/10" />

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[9px] text-[var(--text-faint)]">Page: docs.yourproduct.com</span>
        <span className="text-[9px] text-[var(--blue-soft)]">
          <AnimatedNumber value="3" /> credits left
        </span>
      </div>
    </div>
  );
}
