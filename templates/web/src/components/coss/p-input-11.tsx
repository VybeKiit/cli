import { InputGroup, InputGroupAddon, InputGroupInput } from '@vybekiit/ui/input-group';
import { Kbd } from '@vybekiit/ui/kbd';

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="Search" placeholder="Search…" type="search" />
      <InputGroupAddon align="inline-end">
        <Kbd>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}
