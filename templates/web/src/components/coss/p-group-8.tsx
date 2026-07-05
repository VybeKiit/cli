import { Group, GroupSeparator, GroupText } from '@/components/ui/group';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <Input aria-label="Domain" defaultValue="coss" id="domain-suffix" type="text" />
      <GroupSeparator />
      <GroupText render={<Label aria-label="Domain suffix" htmlFor="domain-suffix" />}>
        .com
      </GroupText>
    </Group>
  );
}
