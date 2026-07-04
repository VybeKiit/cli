import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Particle() {
  return (
    <TooltipProvider>
      <ToggleGroup defaultValue={['bold']} multiple={true}>
        <Tooltip>
          <TooltipTrigger render={<ToggleGroupItem aria-label="Toggle bold" value="bold" />}>
            <BoldIcon />
          </TooltipTrigger>
          <TooltipPopup>Bold</TooltipPopup>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<ToggleGroupItem aria-label="Toggle italic" value="italic" />}>
            <ItalicIcon />
          </TooltipTrigger>
          <TooltipPopup>Italic</TooltipPopup>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={<ToggleGroupItem aria-label="Toggle underline" value="underline" />}
          >
            <UnderlineIcon />
          </TooltipTrigger>
          <TooltipPopup>Underline</TooltipPopup>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
