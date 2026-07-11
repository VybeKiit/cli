import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useId, useState } from 'react';

type SettingsForm = {
  readonly displayName: string;
  readonly email: string;
  readonly productUpdates: boolean;
};

const INITIAL: SettingsForm = {
  displayName: 'Maya Chen',
  email: 'maya@example.com',
  productUpdates: true,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Interactive extension settings (profile + alert toggle) with practice save.
 *
 * @returns Compact settings screen for popup / side panel.
 * @example
 * <SettingsScreen />
 */
export const SettingsScreen = () => {
  const nameId = useId();
  const emailId = useId();
  const notifyId = useId();
  const [saved, setSaved] = useState<SettingsForm>(INITIAL);
  const [form, setForm] = useState<SettingsForm>(INITIAL);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const save = () => {
    if (!EMAIL_PATTERN.test(form.email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setPending(true);
    // TODO(vybekiit): PATCH settings via connect-account-backend
    globalThis.setTimeout(() => {
      setSaved(form);
      setPending(false);
      setFlash('Settings saved (practice mode).');
    }, 600);
  };

  const handleDiscard = (): void => {
    setForm(saved);
    setError('');
    setFlash('');
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-1">
        <h1 className="font-bold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Profile and notification preferences for this extension.
        </p>
      </header>

      {flash ? (
        <Alert>
          <AlertDescription>{flash}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>How you appear in the side panel</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4 pt-0">
          <FormField
            id={nameId}
            label="Display name"
            onChange={(event) =>
              setForm((current) => ({ ...current, displayName: event.target.value }))
            }
            value={form.displayName}
          />
          <FormField
            id={emailId}
            label="Email"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            type="email"
            value={form.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Alerts</CardTitle>
          <CardDescription>Product update notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <label className="flex items-center justify-between gap-3 text-sm" htmlFor={notifyId}>
            <span>
              <span className="block font-medium">Product updates</span>
              <span className="block text-muted-foreground text-xs">New features and tips</span>
            </span>
            <input
              checked={form.productUpdates}
              id={notifyId}
              onChange={() =>
                setForm((current) => ({
                  ...current,
                  productUpdates: !current.productUpdates,
                }))
              }
              type="checkbox"
            />
          </label>
        </CardContent>
      </Card>

      {dirty ? (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleDiscard} type="button" variant="outline">
            Discard
          </Button>
          <Button disabled={pending} onClick={save} type="button">
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
