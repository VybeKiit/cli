import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';

export default function Particle() {
  return (
    <Button variant="outline">
      Messages
      <Badge className="-me-1" variant="outline">
        18
      </Badge>
    </Button>
  );
}
