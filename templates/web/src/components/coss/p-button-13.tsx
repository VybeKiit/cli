import { PlusIcon } from 'lucide-react';
import { Button } from '@vybekiit/ui/button';

export default function Particle() {
  return (
    <Button aria-label="Add" size="icon">
      <PlusIcon aria-hidden="true" />
    </Button>
  );
}
