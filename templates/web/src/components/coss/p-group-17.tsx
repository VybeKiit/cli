import { Group, GroupSeparator, GroupText } from '@/components/ui/group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Particle() {
  return (
    <Group aria-label="Price input">
      <Input
        aria-label="Enter the amount"
        className="text-right"
        defaultValue="100"
        id="amount"
        type="text"
      />
      <GroupSeparator />
      <GroupText render={<Label aria-label="Currency" htmlFor="amount" />}>USD</GroupText>
    </Group>
  );
}
