import { CheckIcon } from 'lucide-react';
import { Badge } from '@vybekiit/ui/badge';

export default function Particle() {
  return (
    <Badge variant="outline">
      <CheckIcon aria-hidden="true" />
      Verified
    </Badge>
  );
}
