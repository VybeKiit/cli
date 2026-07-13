'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@vybekiit/ui/input-group';
import { Search, X } from 'lucide-react';

/** Three InputGroup compositions: search icon, trailing clear button, and URL prefix text. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-8 w-full max-w-sm">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Leading search icon
        </span>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search…" type="search" />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Trailing clear button
        </span>
        <InputGroup>
          <InputGroupInput defaultValue="my-workspace" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Clear" size="icon-xs">
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          URL prefix text
        </span>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="yoursite.com" type="url" />
        </InputGroup>
      </div>
    </div>
  ),
};

export default story;
