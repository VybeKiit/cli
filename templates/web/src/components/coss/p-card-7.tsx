import { CircleAlertIcon } from 'lucide-react';
import { Button } from '@vybekiit/ui/button';
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@vybekiit/ui/card';
import { Field, FieldLabel } from '@vybekiit/ui/field';
import { Form } from '@vybekiit/ui/form';
import { Input } from '@vybekiit/ui/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@vybekiit/ui/select';

const frameworkOptions = [
  { label: 'Next.js', value: 'next' },
  { label: 'Vite', value: 'vite' },
  { label: 'Remix', value: 'remix' },
  { label: 'Astro', value: 'astro' },
];

export default function Particle() {
  return (
    <CardFrame className="w-full max-w-xs">
      <CardFrameHeader>
        <CardFrameTitle>Create project</CardFrameTitle>
        <CardFrameDescription>Deploy your new project in one-click.</CardFrameDescription>
      </CardFrameHeader>
      <Card className="rounded-b-none!">
        <CardPanel>
          <Form className="flex w-full flex-col gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input placeholder="Name of your project" type="text" />
            </Field>
            <Field>
              <FieldLabel>Framework</FieldLabel>
              <Select defaultValue="next" items={frameworkOptions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {frameworkOptions.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Button className="w-full" type="submit">
              Deploy
            </Button>
          </Form>
        </CardPanel>
      </Card>
      <CardFrameFooter>
        <div className="flex gap-1 text-muted-foreground text-xs">
          <CircleAlertIcon className="size-3 h-lh shrink-0" />
          <p>This will take a few seconds to complete.</p>
        </div>
      </CardFrameFooter>
    </CardFrame>
  );
}
