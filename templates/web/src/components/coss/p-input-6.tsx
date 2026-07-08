import { useId } from 'react';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';

export default function Particle() {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input aria-label="Email" id={id} placeholder="you@example.com" type="email" />
    </div>
  );
}
