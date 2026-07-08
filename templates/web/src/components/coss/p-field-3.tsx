import { Field, FieldDescription, FieldLabel } from '@vybekiit/ui/field';
import { Input } from '@vybekiit/ui/input';

export default function Particle() {
  return (
    <Field disabled={true}>
      <FieldLabel>Email</FieldLabel>
      <Input disabled={true} placeholder="Enter your email" type="email" />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  );
}
