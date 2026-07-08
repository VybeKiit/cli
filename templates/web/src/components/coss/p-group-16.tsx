import { PlusIcon } from 'lucide-react';
import { Button } from '@vybekiit/ui/button';
import { Group, GroupSeparator } from '@/components/ui/group';
import { Input } from '@vybekiit/ui/input';

export default function Particle() {
  return (
    <Group aria-label="Add item">
      <Button aria-label="Add" size="icon" variant="outline">
        <PlusIcon aria-hidden="true" />
      </Button>
      <GroupSeparator />
      <Input aria-label="Item name" placeholder="Enter item name" type="text" />
    </Group>
  );
}
