import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        <Switch />
        Email notifications
      </FieldLabel>
    </Field>
  );
}
