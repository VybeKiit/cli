import { Badge } from '@vybekiit/ui/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@vybekiit/ui/input-group';

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Type to search…" type="search" />
      <InputGroupAddon align="inline-end">
        <Badge variant="info">Badge</Badge>
      </InputGroupAddon>
    </InputGroup>
  );
}
