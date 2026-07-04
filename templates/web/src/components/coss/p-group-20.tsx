import { Button } from '@/components/ui/button';
import { Group, GroupSeparator } from '@/components/ui/group';
import { Input } from '@/components/ui/input';

export default function Particle() {
  return (
    <Group aria-label="Email subscription">
      <Input aria-label="Email" placeholder="Email" type="email" />
      <GroupSeparator />
      <Button variant="outline">Subscribe</Button>
    </Group>
  );
}
