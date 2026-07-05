import { Field, FieldError, FieldLabel } from '@vybekiit/ui/field';
import { Textarea } from '@vybekiit/ui/textarea';

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Message <span className="text-destructive-foreground">*</span>
      </FieldLabel>
      <Textarea placeholder="Type your message here" required={true} />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  );
}
