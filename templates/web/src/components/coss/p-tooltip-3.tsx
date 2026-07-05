'use client';

import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@vybekiit/ui/toggle-group';
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from '@vybekiit/ui/tooltip';

const tooltipHandle = TooltipCreateHandle<ComponentType>();

const BoldContent = () => <span>Make text bold</span>;

const ItalicContent = () => <span>Apply italic formatting to text</span>;

const UnderlineContent = () => <span>Underline text</span>;

export default function Particle() {
  return (
    <TooltipProvider>
      <ToggleGroup defaultValue={['bold']} multiple={true}>
        <TooltipTrigger
          className="after:absolute after:left-full after:h-full after:w-1"
          handle={tooltipHandle}
          payload={BoldContent}
          render={<ToggleGroupItem aria-label="Toggle bold" value="bold" />}
        >
          <BoldIcon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipTrigger
          className="after:absolute after:left-full after:h-full after:w-1"
          handle={tooltipHandle}
          payload={ItalicContent}
          render={<ToggleGroupItem aria-label="Toggle italic" value="italic" />}
        >
          <ItalicIcon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipTrigger
          className="after:absolute after:left-full after:h-full after:w-1"
          handle={tooltipHandle}
          payload={UnderlineContent}
          render={<ToggleGroupItem aria-label="Toggle underline" value="underline" />}
        >
          <UnderlineIcon aria-hidden="true" />
        </TooltipTrigger>
      </ToggleGroup>

      <Tooltip handle={tooltipHandle}>
        {({ payload: Payload }) => (
          <TooltipPopup>{Payload !== undefined && <Payload />}</TooltipPopup>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
