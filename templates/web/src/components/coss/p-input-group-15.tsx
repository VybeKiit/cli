import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Subscribe to our newsletter"
        disabled={true}
        placeholder="Your best email"
        type="email"
      />
      <InputGroupAddon align="inline-end">
        <Button aria-label="Subscribe" disabled={true} size="icon-xs" variant="ghost">
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
