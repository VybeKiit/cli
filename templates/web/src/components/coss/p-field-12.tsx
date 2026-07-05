import { Checkbox } from '@vybekiit/ui/checkbox';
import { Field, FieldLabel } from '@vybekiit/ui/field';

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        <Checkbox />
        Accept terms and conditions
      </FieldLabel>
    </Field>
  );
}
