import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { displayError, useTranslations } from '@/hooks/useTranslations';
import { sendEmailCode, verifyEmailCode } from '@/lib/authClient';
import type { MobileClientError } from '@/lib/clientEffect';
import type { AuthUser } from '@vybekiit/auth';
import { type Effect, Either } from 'effect';
import { useRouter } from 'expo-router';
import { useState } from 'react';

type AuthAction =
  | { kind: 'verify'; email: string; code: string }
  | { kind: 'resend'; email: string };

const runAuthAction = (action: AuthAction): Effect.Effect<AuthUser | true, MobileClientError> => {
  if (action.kind === 'verify') {
    return verifyEmailCode(action.email, action.code);
  }

  return sendEmailCode(action.email);
};

/**
 * Render the mobile email verification screen.
 *
 * @returns React Native email verification screen.
 * @example
 * <VerifyScreen />
 */
const VerifyScreen = () => {
  const router = useRouter();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const { loading: pending, error, run: submit } = useAsync(runAuthAction);

  const handleVerify = async () => {
    setMessage('');
    const result = await submit({ kind: 'verify', email, code });
    if (Either.isLeft(result)) {
      return;
    }

    router.replace('/dashboard');
  };

  const handleResend = async () => {
    setMessage('');
    const result = await submit({ kind: 'resend', email });
    if (Either.isLeft(result)) {
      return;
    }

    const sent = t('auth.verify.codeSent');
    setMessage(sent);
    toast(sent);
  };

  return (
    <AuthShell titleKey="auth.verify.title" descriptionKey="auth.verify.description">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription destructive={true}>{displayError(t, error)}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label={t('auth.verify.emailLabel')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label={t('auth.verify.codeLabel')}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        value={code}
        onChangeText={setCode}
      />
      <Button
        title={pending ? t('auth.verify.submitting') : t('auth.verify.submit')}
        loading={pending}
        onPress={handleVerify}
      />
      <Button title={t('auth.verify.resend')} variant="ghost" onPress={handleResend} />
    </AuthShell>
  );
};

export default VerifyScreen;
