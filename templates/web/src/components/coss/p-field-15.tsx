import { Field, FieldLabel } from '@vybekiit/ui/field';
import { Switch } from '@vybekiit/ui/switch';

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
