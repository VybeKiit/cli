'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Avatar, AvatarFallback, AvatarImage } from '@vybekiit/ui/avatar';

/** Avatar sizes and the image-vs-fallback paths, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Small</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">AL</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <Avatar>
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Large</span>
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-base">VK</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Image</span>
        <Avatar>
          <AvatarImage alt="Ada Lovelace" src="https://i.pravatar.cc/80?img=47" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
};

export default story;
