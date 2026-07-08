import { Field, FieldError, FieldLabel } from '@vybekiit/ui/field';
import { Input } from '@vybekiit/ui/input';

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Password <span className="text-destructive-foreground">*</span>
      </FieldLabel>
      <Input placeholder="Enter password" required={true} type="password" />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  );
}
