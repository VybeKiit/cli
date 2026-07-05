'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@vybekiit/ui/button';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { Field, FieldLabel } from '@vybekiit/ui/field';
import { Form } from '@vybekiit/ui/form';

export default function Particle() {
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    const accepted = formData.get('terms');
    alert(`Terms: ${accepted}`);
  };
  return (
    <Form className="flex w-auto flex-col gap-4" onSubmit={onSubmit}>
      <Field name="terms">
        <FieldLabel>
          <Checkbox defaultChecked={true} value="yes" />
          Accept terms and conditions
        </FieldLabel>
      </Field>
      <Button loading={loading} type="submit">
        Submit
      </Button>
    </Form>
  );
}
