import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function Particle() {
  return (
    <Field disabled={true}>
      <FieldLabel>Email</FieldLabel>
      <Input disabled={true} placeholder="Enter your email" type="email" />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  );
}
