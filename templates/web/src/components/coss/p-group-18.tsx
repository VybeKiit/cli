import { Group, GroupSeparator } from '@/components/ui/group';
import { Input } from '@vybekiit/ui/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@vybekiit/ui/select';

const protocols = [
  { label: 'https://', value: 'https' },
  { label: 'http://', value: 'http' },
  { label: 'ftp://', value: 'ftp' },
  { label: 'sftp://', value: 'sftp' },
];

export default function Particle() {
  return (
    <Group aria-label="URL input">
      <Select defaultValue="https" items={protocols}>
        <SelectTrigger className="w-fit min-w-none">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {protocols.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <GroupSeparator />
      <Input aria-label="IP address" placeholder="192.168.1.1" type="text" />
    </Group>
  );
}
