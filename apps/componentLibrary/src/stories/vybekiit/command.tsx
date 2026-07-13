'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@vybekiit/ui/command';
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react';

/** Inline Command palette with two groups, separator, and empty state — no dialog. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col items-start gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Inline command palette
        </span>
        <Command className="rounded-lg border shadow-md w-80">
          <CommandInput placeholder="Type a command…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Calendar className="text-muted-foreground" />
                Calendar
              </CommandItem>
              <CommandItem>
                <Smile className="text-muted-foreground" />
                Search emoji
              </CommandItem>
              <CommandItem>
                <Calculator className="text-muted-foreground" />
                Calculator
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User className="text-muted-foreground" />
                Profile
              </CommandItem>
              <CommandItem>
                <CreditCard className="text-muted-foreground" />
                Billing
              </CommandItem>
              <CommandItem>
                <Settings className="text-muted-foreground" />
                Settings
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  ),
};

export default story;
