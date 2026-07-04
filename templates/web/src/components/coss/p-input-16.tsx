import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput disabled={true} placeholder="Processing…" type="search" />
      <InputGroupAddon align="inline-end">
        <Spinner />
      </InputGroupAddon>
    </InputGroup>
  );
}
