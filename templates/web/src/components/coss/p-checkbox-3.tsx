import { useId } from 'react';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { Label } from '@vybekiit/ui/label';

export default function Particle() {
  const id = useId();

  return (
    <div className="flex items-start gap-2">
      <Checkbox defaultChecked={true} id={id} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>Accept terms and conditions</Label>
        <p className="text-muted-foreground text-xs">
          By clicking this checkbox, you agree to the terms and conditions.
        </p>
      </div>
    </div>
  );
}
