import { Checkbox } from '@vybekiit/ui/checkbox';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { Label } from '@vybekiit/ui/label';

export default function Particle() {
  return (
    <CheckboxGroup aria-label="Select frameworks" defaultValue={['next']}>
      <Label>
        <Checkbox value="next" />
        Next.js
      </Label>
      <Label>
        <Checkbox value="vite" />
        Vite
      </Label>
      <Label>
        <Checkbox value="astro" />
        Astro
      </Label>
    </CheckboxGroup>
  );
}
