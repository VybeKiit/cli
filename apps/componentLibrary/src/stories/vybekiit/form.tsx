'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@vybekiit/ui/form';
import { Input } from '@vybekiit/ui/input';
import { useForm } from 'react-hook-form';

const EmailForm = () => {
  const form = useForm({ defaultValues: { email: '' } });

  const onSubmit = (data: { email: string }) => {
    // no-op — story only
    void data;
  };

  return (
    <Form {...form}>
      <form className="w-full max-w-sm space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input placeholder="you@company.com" type="email" {...field} />
              </FormControl>
              <FormDescription>We'll never share your email with anyone.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          Subscribe
        </Button>
      </form>
    </Form>
  );
};

const ErrorForm = () => {
  const form = useForm({
    defaultValues: { email: 'not-an-email' },
    mode: 'onChange',
  });

  // Trigger validation so errors show immediately in the story.
  form.setError('email', { type: 'pattern', message: 'Enter a valid email address.' });

  return (
    <Form {...form}>
      <form className="w-full max-w-sm space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input placeholder="you@company.com" type="email" {...field} />
              </FormControl>
              <FormDescription>We'll never share your email with anyone.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          Subscribe
        </Button>
      </form>
    </Form>
  );
};

/** Operable Form: a default state and a pre-triggered error state, both using react-hook-form. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap gap-x-12 gap-y-8">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Default
        </span>
        <EmailForm />
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          With validation error
        </span>
        <ErrorForm />
      </div>
    </div>
  ),
};

export default story;
