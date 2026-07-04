import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Particle() {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        Email <span className="text-destructive">*</span>
      </Label>
      <Input id={id} placeholder="Email" required={true} type="email" />
    </div>
  );
}
