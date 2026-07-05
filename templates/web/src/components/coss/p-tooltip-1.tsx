import { Button } from '@vybekiit/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@vybekiit/ui/tooltip';

export default function Particle() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
      <TooltipPopup>Helpful hint</TooltipPopup>
    </Tooltip>
  );
}
