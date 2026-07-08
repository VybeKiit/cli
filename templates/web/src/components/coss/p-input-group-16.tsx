import { InputGroup, InputGroupAddon, InputGroupInput } from '@vybekiit/ui/input-group';
import { Spinner } from '@vybekiit/ui/spinner';

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput disabled={true} placeholder="Searching…" type="search" />
      <InputGroupAddon align="inline-end">
        <Spinner />
      </InputGroupAddon>
    </InputGroup>
  );
}
