import { Group, GroupSeparator, GroupText } from '@/components/ui/group';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <GroupText render={<Label aria-label="Domain" htmlFor="domain" />}>https://</GroupText>
      <GroupSeparator />
      <Input aria-label="Domain" defaultValue="coss.com" id="domain" type="text" />
    </Group>
  );
}
