'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@vybekiit/ui/button';
import { Field, FieldLabel } from '@vybekiit/ui/field';
import { Form } from '@vybekiit/ui/form';
import { Switch } from '@vybekiit/ui/switch';

export default function Particle() {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    console.log(formData.get('marketing'));

    const enabled = formData.get('marketing');
    alert(`Marketing emails: ${enabled}`);
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field name="marketing">
        <FieldLabel>
          <Switch defaultChecked={true} name="marketing" />
          Enable marketing emails
        </FieldLabel>
      </Field>
      <Button loading={loading} type="submit">
        Submit
      </Button>
    </Form>
  );
}
