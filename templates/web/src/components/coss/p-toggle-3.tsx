import { BoldIcon } from 'lucide-react';
import { Toggle } from '@vybekiit/ui/toggle';

export default function Particle() {
  return (
    <Toggle aria-label="Toggle bold" variant="outline">
      <BoldIcon />
    </Toggle>
  );
}
