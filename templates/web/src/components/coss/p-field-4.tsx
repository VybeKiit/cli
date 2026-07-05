import { Field, FieldError, FieldLabel } from '@vybekiit/ui/field';
import { Input } from '@vybekiit/ui/input';

export default function FieldWithErrorDemo() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="Enter your email" type="email" />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  );
}
