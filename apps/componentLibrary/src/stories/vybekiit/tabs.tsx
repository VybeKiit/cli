'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vybekiit/ui/tabs';

/** A real, switchable Tabs group with content per tab. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <Tabs className="w-full max-w-md" defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent className="text-muted-foreground text-sm" value="overview">
        A snapshot of your workspace and recent metrics.
      </TabsContent>
      <TabsContent className="text-muted-foreground text-sm" value="activity">
        Everything that happened across your projects this week.
      </TabsContent>
      <TabsContent className="text-muted-foreground text-sm" value="settings">
        Manage members, billing, and integrations.
      </TabsContent>
    </Tabs>
  ),
};

export default story;
