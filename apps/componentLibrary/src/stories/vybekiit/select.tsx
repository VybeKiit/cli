'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';

/** One real, openable Select. */
const FrameworkSelect = ({ disabled }: { readonly disabled?: boolean }) => (
  <Select disabled={disabled}>
    <SelectTrigger className="w-56">
      <SelectValue placeholder="Choose a framework" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="next">Next.js</SelectItem>
      <SelectItem value="astro">Astro</SelectItem>
      <SelectItem value="expo">Expo</SelectItem>
    </SelectContent>
  </Select>
);

/** Default and disabled Select triggers — open one to see the real menu. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <FrameworkSelect />
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Disabled</span>
        <FrameworkSelect disabled={true} />
      </div>
    </div>
  ),
};

export default story;
