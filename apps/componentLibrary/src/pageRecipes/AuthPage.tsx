'use client';

import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Separator } from '@vybekiit/ui/separator';
import {
  CircleAlert,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  type FormEvent,
  type ReactNode,
  type SVGProps,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

const GoogleLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
    <path
      d="M21.6 12.23c0-.73-.07-1.43-.19-2.1H12v3.98h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.89-1.74 2.99-4.3 2.99-7.4Z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.22-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A9.99 9.99 0 0 0 12 22Z"
      fill="#34A853"
    />
    <path
      d="M6.41 13.89A6.01 6.01 0 0 1 6.1 12c0-.66.11-1.3.31-1.89V7.53H3.08A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.33-2.58Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.96 3 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.53l3.33 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
      fill="#EA4335"
    />
  </svg>
);

type AuthMode = 'sign-in' | 'sign-up' | 'reset';
type SignInMethod = 'password' | 'magic-link';
type AuthStatus = 'idle' | 'submitting' | 'error' | 'sent' | 'signed-in';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
/** Type this password to see the error path (a real app gets this result from the auth provider). */
const WRONG_PASSWORD = 'wrongpass';

const MODE_COPY: Record<AuthMode, { title: string; subtitle: string }> = {
  'sign-in': { title: 'Welcome back', subtitle: 'Sign in to your workspace.' },
  'sign-up': { title: 'Create your account', subtitle: 'Start shipping in minutes.' },
  reset: { title: 'Reset your password', subtitle: "We'll email you a secure reset link." },
};

/** The "check your inbox" copy shown after a sign-up / reset / magic-link submit. */
const sentMessageFor = (mode: AuthMode, email: string): string => {
  if (mode === 'sign-up') {
    return `Verify your email — we sent a confirmation link to ${email}.`;
  }
  if (mode === 'reset') {
    return `We emailed a password reset link to ${email}.`;
  }
  return `We emailed a magic sign-in link to ${email}.`;
};

/** The primary submit-button label for the current mode + sign-in method. */
const submitLabelFor = (mode: AuthMode, method: SignInMethod): string => {
  if (mode === 'sign-up') {
    return 'Create account';
  }
  if (mode === 'reset') {
    return 'Send reset link';
  }
  if (method === 'magic-link') {
    return 'Email me a magic link';
  }
  return 'Sign in';
};

/**
 * A production-shaped auth page: sign-in / sign-up / reset modes, password + magic-link + OAuth,
 * live validation, and accessible submitting / error / email-sent / signed-in states. Fully
 * interactive with local state — no backend needed to demo it; see the "Plug this into your app"
 * panel for the real `@vybekiit/auth` wiring.
 *
 * @returns The auth recipe element.
 * @example
 * const element = <AuthPage />;
 */
export const AuthPage = () => {
  const nameId = useId();
  const emailId = useId();
  const emailErrorId = useId();
  const passwordId = useId();
  const passwordErrorId = useId();
  const confirmId = useId();
  const confirmErrorId = useId();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [method, setMethod] = useState<SignInMethod>('password');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState('');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const usesPassword = mode === 'sign-up' || (mode === 'sign-in' && method === 'password');
  const emailValid = EMAIL_PATTERN.test(email);
  const passwordValid = mode === 'sign-in' ? password.length > 0 : password.length >= MIN_PASSWORD;
  const confirmValid = mode !== 'sign-up' || (confirm.length > 0 && confirm === password);
  const nameValid = mode !== 'sign-up' || name.trim().length > 0;
  const formValid = emailValid && nameValid && (!usesPassword || passwordValid) && confirmValid;

  useEffect(() => {
    if (status === 'sent' || status === 'signed-in') {
      resultHeadingRef.current?.focus();
    }
  }, [status]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setSubmitted(false);
    setStatus('idle');
    setErrorMessage(null);
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid) {
      return;
    }
    setErrorMessage(null);
    setStatus('submitting');
    globalThis.setTimeout(() => {
      if (mode === 'sign-in' && method === 'password' && password === WRONG_PASSWORD) {
        setStatus('error');
        setErrorMessage('Incorrect email or password. Try again or reset your password.');
        return;
      }
      if (mode === 'sign-in' && method === 'password') {
        setStatus('signed-in');
        return;
      }
      setSentMessage(sentMessageFor(mode, email));
      setStatus('sent');
    }, 1100);
  };

  const startOauth = (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    // A real app calls signInWithOAuth(provider), which redirects. Here we just show the handoff.
    globalThis.setTimeout(() => setOauthLoading(null), 1400);
  };

  // ---------- signed-in / email-sent ----------
  if (status === 'signed-in' || status === 'sent') {
    const signedIn = status === 'signed-in';
    return (
      <Frame>
        <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <span
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              signedIn ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary',
            )}
          >
            {signedIn ? (
              <ShieldCheck aria-hidden="true" className="h-8 w-8" />
            ) : (
              <MailCheck aria-hidden="true" className="h-8 w-8" />
            )}
          </span>
          <h1
            className="mt-6 font-bold text-2xl tracking-tight outline-none md:text-3xl"
            ref={resultHeadingRef}
            tabIndex={-1}
          >
            {signedIn ? "You're signed in" : 'Check your inbox'}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {signedIn ? `Signed in as ${email}. Redirecting to your workspace…` : sentMessage}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {signedIn ? null : (
              <Button onClick={() => setStatus('idle')} type="button" variant="outline">
                Use a different method
              </Button>
            )}
            <Button
              onClick={() => {
                switchMode('sign-in');
                setMethod('password');
              }}
              type="button"
              variant={signedIn ? 'default' : 'ghost'}
            >
              Back to sign in
            </Button>
          </div>
        </section>
      </Frame>
    );
  }

  // ---------- form ----------
  const submitting = status === 'submitting';
  const submitLabel = submitLabelFor(mode, method);
  return (
    <Frame>
      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_440px]">
        {/* value panel — hidden on small screens */}
        <aside className="hidden space-y-6 lg:block">
          <Badge className="w-fit" variant="secondary">
            Account access
          </Badge>
          <h2 className="font-bold text-4xl tracking-tight">One login, every surface.</h2>
          <p className="max-w-md text-muted-foreground">
            The same screen powers password, magic-link, and social sign-in across your web, mobile,
            and extension apps.
          </p>
          <ul className="space-y-3">
            {[
              {
                icon: <Lock className="h-4 w-4" />,
                text: 'Passwords hashed by your auth provider — never stored here.',
              },
              {
                icon: <Sparkles className="h-4 w-4" />,
                text: 'Magic links and OAuth share this exact layout.',
              },
              {
                icon: <Users className="h-4 w-4" />,
                text: 'Row-level security keeps each account isolated.',
              },
            ].map((row) => (
              <li className="flex items-start gap-3 text-sm" key={row.text}>
                <span className="mt-0.5 text-primary">{row.icon}</span>
                <span className="text-muted-foreground">{row.text}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="w-full rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="font-semibold text-2xl">{MODE_COPY[mode].title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">{MODE_COPY[mode].subtitle}</p>
          </div>

          {mode === 'reset' ? null : (
            <div
              aria-label="Choose sign in or sign up"
              className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
              role="tablist"
            >
              {(['sign-in', 'sign-up'] as const).map((option) => (
                <button
                  aria-selected={mode === option}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium text-sm transition-colors',
                    mode === option ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                  key={option}
                  onClick={() => switchMode(option)}
                  role="tab"
                  type="button"
                >
                  {option === 'sign-in' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>
          )}

          {errorMessage ? (
            <Alert className="mb-4" variant="destructive">
              <CircleAlert aria-hidden="true" className="h-4 w-4" />
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <form className="space-y-4" noValidate={true} onSubmit={handleSubmit}>
            {mode === 'sign-up' ? (
              <Field id={nameId} label="Full name">
                <Input
                  aria-invalid={submitted && !nameValid}
                  autoComplete="name"
                  id={nameId}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ada Lovelace"
                  value={name}
                />
              </Field>
            ) : null}

            <Field id={emailId} label="Email">
              <Input
                aria-describedby={submitted && !emailValid ? emailErrorId : undefined}
                aria-invalid={submitted && !emailValid}
                autoComplete="email"
                id={emailId}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              {submitted && !emailValid ? (
                <FieldError id={emailErrorId}>Enter a valid email address.</FieldError>
              ) : null}
            </Field>

            {usesPassword ? (
              <Field id={passwordId} label={mode === 'sign-in' ? 'Password' : 'Create a password'}>
                <div className="relative">
                  <Input
                    aria-describedby={submitted && !passwordValid ? passwordErrorId : undefined}
                    aria-invalid={submitted && !passwordValid}
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    className="pr-10"
                    id={passwordId}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {submitted && !passwordValid ? (
                  <FieldError id={passwordErrorId}>
                    {mode === 'sign-in'
                      ? 'Enter your password.'
                      : `Use at least ${MIN_PASSWORD} characters.`}
                  </FieldError>
                ) : null}
              </Field>
            ) : null}

            {mode === 'sign-up' ? (
              <Field id={confirmId} label="Confirm password">
                <Input
                  aria-describedby={submitted && !confirmValid ? confirmErrorId : undefined}
                  aria-invalid={submitted && !confirmValid}
                  autoComplete="new-password"
                  id={confirmId}
                  onChange={(event) => setConfirm(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                />
                {submitted && !confirmValid ? (
                  <FieldError id={confirmErrorId}>Passwords don't match.</FieldError>
                ) : null}
              </Field>
            ) : null}

            {mode === 'sign-in' && method === 'password' ? (
              <div className="flex justify-end">
                <button
                  className="text-muted-foreground text-sm hover:text-foreground"
                  onClick={() => switchMode('reset')}
                  type="button"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            <Button aria-busy={submitting} className="w-full" disabled={submitting} type="submit">
              {submitting ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Please wait…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </form>

          {mode === 'sign-in' ? (
            <>
              <div className="my-4 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-xs">or</span>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setMethod(method === 'password' ? 'magic-link' : 'password')}
                  type="button"
                  variant="outline"
                >
                  {method === 'password' ? (
                    <>
                      <Mail aria-hidden="true" className="h-4 w-4" /> Use a magic link instead
                    </>
                  ) : (
                    <>
                      <KeyRound aria-hidden="true" className="h-4 w-4" /> Use a password instead
                    </>
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={oauthLoading !== null}
                    onClick={() => startOauth('google')}
                    type="button"
                    variant="ghost"
                  >
                    {oauthLoading === 'google' ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleLogo className="h-4 w-4" />
                    )}
                    Google
                  </Button>
                  <Button
                    disabled={oauthLoading !== null}
                    onClick={() => startOauth('github')}
                    type="button"
                    variant="ghost"
                  >
                    {oauthLoading === 'github' ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Github aria-hidden="true" className="h-4 w-4" />
                    )}
                    GitHub
                  </Button>
                </div>
                <p aria-live="polite" className="min-h-4 text-center text-muted-foreground text-xs">
                  {oauthLoading
                    ? `Redirecting to ${oauthLoading === 'google' ? 'Google' : 'GitHub'}…`
                    : ''}
                </p>
              </div>
            </>
          ) : null}

          {mode === 'reset' ? (
            <button
              className="mt-4 w-full text-center text-muted-foreground text-sm hover:text-foreground"
              onClick={() => switchMode('sign-in')}
              type="button"
            >
              Back to sign in
            </button>
          ) : null}

          <details className="mt-6 rounded-lg border bg-muted/20 p-3 text-sm">
            <summary className="cursor-pointer font-medium">Plug this into your app</summary>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                Fully interactive with local state — no backend needed to demo it. To make it real
                with <code>@vybekiit/auth</code> (Supabase by default):
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  Provision Supabase via the <code>onboarding</code> skill (sets{' '}
                  <code>SUPABASE_URL</code> / <code>SUPABASE_ANON_KEY</code>).
                </li>
                <li>
                  Wire submit to <code>signIn({'{ email, password }'})</code>,{' '}
                  <code>signUp({'{ name, email, password }'})</code>,{' '}
                  <code>sendMagicLink(email)</code>, or <code>resetPassword(email)</code>.
                </li>
                <li>
                  OAuth buttons → <code>signInWithOAuth('google' | 'github')</code> (redirects).
                </li>
                <li>On success, route to your app; the session is set by the provider.</li>
              </ol>
            </div>
          </details>
        </div>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="Auth motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** A labelled form field wrapper. */
const Field = ({
  id,
  label,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

/** Inline field error text (announced to assistive tech). */
const FieldError = ({ id, children }: { readonly id: string; readonly children: ReactNode }) => (
  <p className="text-destructive text-sm" id={id} role="alert">
    {children}
  </p>
);
