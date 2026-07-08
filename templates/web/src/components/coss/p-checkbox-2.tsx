import { Checkbox } from '@vybekiit/ui/checkbox';
import { Label } from '@vybekiit/ui/label';

export default function Particle() {
  return (
    <Label>
      <Checkbox defaultChecked={true} disabled={true} />
      Accept terms and conditions
    </Label>
  );
}
