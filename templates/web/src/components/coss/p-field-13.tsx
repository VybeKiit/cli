'use client';

import { Checkbox } from '@vybekiit/ui/checkbox';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { Field, FieldItem, FieldLabel } from '@vybekiit/ui/field';
import { Fieldset, FieldsetLegend } from '@/components/ui/fieldset';

export default function Particle() {
  return (
    <Field className="gap-2" name="frameworks" render={(props) => <Fieldset {...props} />}>
      <FieldsetLegend className="font-medium text-sm">Frameworks</FieldsetLegend>
      <CheckboxGroup defaultValue={['react']}>
        <FieldItem>
          <FieldLabel>
            <Checkbox value="react" /> React
          </FieldLabel>
        </FieldItem>
        <FieldItem>
          <FieldLabel>
            <Checkbox value="vue" /> Vue
          </FieldLabel>
        </FieldItem>
        <FieldItem>
          <FieldLabel>
            <Checkbox value="svelte" /> Svelte
          </FieldLabel>
        </FieldItem>
      </CheckboxGroup>
    </Field>
  );
}
