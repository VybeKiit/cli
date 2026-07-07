import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Textarea } from '@vybekiit/ui/textarea';
import { Bell, Mail } from 'lucide-react';

/**
 * Render a source-backed email and notifications page recipe.
 *
 * @returns A ready notification settings page component.
 * @example
 * const element = <EmailNotificationsPage />;
 */
export const EmailNotificationsPage = () => {
  // TODO: Send test emails through the configured email provider.
  // TODO: Save notification preferences through the notifications feature.
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <Badge className="mb-4" variant="secondary">
            Email
          </Badge>
          <Mail className="mb-4 h-6 w-6 text-blue-600" />
          <h1 className="font-bold text-3xl tracking-tight">Send a test email</h1>
          <div className="mt-5 space-y-3">
            <Input defaultValue="customer@example.com" />
            <Textarea defaultValue="Welcome to your new workspace." />
            <Button type="button">Send test</Button>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <Badge className="mb-4" variant="secondary">
            Notifications
          </Badge>
          <Bell className="mb-4 h-6 w-6 text-amber-600" />
          <h2 className="font-bold text-3xl tracking-tight">Alert preferences</h2>
          <div className="mt-5 space-y-3">
            {['Product updates', 'Billing alerts', 'Weekly summary'].map((label) => (
              <div className="flex items-center justify-between rounded-lg border p-3" key={label}>
                <span className="font-medium text-sm">{label}</span>
                <Button size="sm" type="button" variant="outline">
                  Enabled
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
