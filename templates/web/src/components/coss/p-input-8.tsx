import { InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Set your URL"
        className="*:[input]:ps-0!"
        placeholder="coss.com"
        type="text"
      />
      <InputGroupAddon>https://</InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <Popover>
          <PopoverTrigger
            openOnHover={true}
            render={<Button aria-label="More info" size="icon-xs" variant="ghost" />}
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverPopup side="top" tooltipStyle={true}>
            <p>The URL of your website</p>
          </PopoverPopup>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
