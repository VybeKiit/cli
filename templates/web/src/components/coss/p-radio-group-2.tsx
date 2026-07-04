import { Label } from '@/components/ui/label';
import { Radio, RadioGroup } from '@/components/ui/radio-group';

export default function Particle() {
  return (
    <RadioGroup defaultValue="next">
      <Label>
        <Radio value="next" /> Next.js
      </Label>
      <Label>
        <Radio disabled={true} value="vite" /> Vite (disabled)
      </Label>
      <Label>
        <Radio value="astro" /> Astro
      </Label>
    </RadioGroup>
  );
}
