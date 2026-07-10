import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/theme/useTheme';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

type NotificationKey = 'productUpdates' | 'billingReceipts' | 'securityAlerts';

type SettingsForm = {
  readonly fullName: string;
  readonly email: string;
  readonly notifications: Readonly<Record<NotificationKey, boolean>>;
};

const INITIAL: SettingsForm = {
  fullName: 'Maya Chen',
  email: 'maya@example.com',
  notifications: {
    productUpdates: true,
    billingReceipts: true,
    securityAlerts: true,
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NOTIFICATION_ROWS: readonly {
  readonly key: NotificationKey;
  readonly title: string;
  readonly detail: string;
}[] = [
  { key: 'productUpdates', title: 'Product updates', detail: 'New features and improvements.' },
  {
    key: 'billingReceipts',
    title: 'Billing receipts',
    detail: 'Invoices and payment confirmations.',
  },
  { key: 'securityAlerts', title: 'Security alerts', detail: 'New sign-ins and password changes.' },
];

/**
 * Interactive mobile account settings with local practice save.
 *
 * @returns React Native settings screen.
 * @example
 * <SettingsScreen />
 */
const SettingsScreen = () => {
  const { colors, spacing, fontSizes, radius } = useTheme();
  const [saved, setSaved] = useState<SettingsForm>(INITIAL);
  const [form, setForm] = useState<SettingsForm>(INITIAL);
  const [pending, setPending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState('');

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const save = () => {
    if (!EMAIL_PATTERN.test(form.email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError('');
    setPending(true);
    // TODO(vybekiit): PATCH settings via backend / web API
    globalThis.setTimeout(() => {
      setSaved(form);
      setPending(false);
      setStatus('Settings saved (practice mode).');
    }, 700);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.md }]}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.foreground, fontSize: fontSizes.xl, fontWeight: '700' }}>
          Settings
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          Profile and notification preferences. Change a field to enable save.
        </Text>
      </View>

      {status.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Saved</CardTitle>
            <CardDescription>{status}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear in the app</CardDescription>
        </CardHeader>
        <CardContent style={{ gap: spacing.md }}>
          <FormField
            label="Full name"
            onChangeText={(fullName) => setForm((current) => ({ ...current, fullName }))}
            value={form.fullName}
          />
          <FormField
            autoCapitalize="none"
            error={emailError}
            keyboardType="email-address"
            label="Email"
            onChangeText={(email) => setForm((current) => ({ ...current, email }))}
            value={form.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what we alert you about</CardDescription>
        </CardHeader>
        <CardContent style={{ gap: spacing.md }}>
          {NOTIFICATION_ROWS.map((row) => (
            <View
              key={row.key}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: colors.foreground, fontSize: fontSizes.sm, fontWeight: '600' }}
                >
                  {row.title}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.xs }}>
                  {row.detail}
                </Text>
              </View>
              <Switch
                onValueChange={() =>
                  setForm((current) => ({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      [row.key]: !current.notifications[row.key],
                    },
                  }))
                }
                value={form.notifications[row.key]}
              />
            </View>
          ))}
        </CardContent>
      </Card>

      {dirty ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              onPress={() => {
                setForm(saved);
                setEmailError('');
                setStatus('');
              }}
              title="Discard"
              variant="outline"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button loading={pending} onPress={save} title={pending ? 'Saving…' : 'Save'} />
          </View>
        </View>
      ) : null}

      <Pressable
        style={{
          borderColor: colors.border,
          borderRadius: radius,
          borderWidth: 1,
          padding: spacing.md,
        }}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.xs }}>
          Agent wiring: PATCH settings through the account backend when save-data / connect-account
          is complete.
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});

export default SettingsScreen;
