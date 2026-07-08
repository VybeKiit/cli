import { Badge } from '@vybekiit/ui/badge';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { type SVGProps, useId } from 'react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

const GoogleLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-label="Google" role="img" viewBox="0 0 24 24" {...props}>
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

/**
 * Render a source-backed auth page recipe.
 *
 * @returns A ready auth page component for sign-in, sign-up, OTP, and reset flows.
 * @example
 * const element = <AuthPage />;
 */
export const AuthPage = () => {
  const emailId = useId();
  const passwordId = useId();
  const errorEmailId = useId();
  const errorTextId = useId();

  // TODO: Connect this form to the active Supabase auth provider.
  // TODO: Connect phone and email-code buttons to the configured auth methods.
  return (
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="fade" title="Auth motion pass">
        <main className="min-h-screen bg-background px-4 py-10 text-foreground">
          <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div className="space-y-6">
              <Badge className="w-fit" variant="secondary">
                Account access
              </Badge>
              <div className="space-y-3">
                <h1 className="font-bold text-4xl tracking-tight md:text-5xl">Welcome back</h1>
                <p className="max-w-xl text-muted-foreground">
                  A complete starter screen for sign in, sign up, verification, phone codes, and
                  password recovery.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-emerald-600" />
                  <p className="font-medium text-sm">Protected account area</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Connect the submit action to your auth provider before launch.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <MessageCircle className="mb-3 h-5 w-5 text-blue-600" />
                  <p className="font-medium text-sm">Code-based sign in</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Email links, SMS codes, and social sign in share the same layout.
                  </p>
                </div>
              </div>

              <DemoVariantGrid
                description="Compare form density, error color, success color, and copy scale."
                title="Auth states"
              >
                <DemoVariantCard label="Loaded" tone="muted">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
                  <p className="font-medium text-sm">Default form is ready.</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Safe example values keep the layout stable.
                  </p>
                </DemoVariantCard>
                <DemoVariantCard label="Input error">
                  <AlertCircle className="mb-3 h-5 w-5 text-destructive" />
                  <div className="space-y-2">
                    <Label htmlFor={errorEmailId}>Email with error</Label>
                    <Input
                      aria-describedby={errorTextId}
                      aria-invalid={true}
                      defaultValue="not-an-email"
                      id={errorEmailId}
                      type="email"
                    />
                    <p className="text-destructive text-xs" id={errorTextId}>
                      Enter a valid email address.
                    </p>
                  </div>
                </DemoVariantCard>
                <DemoVariantCard label="Success" tone="primary">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
                  <p className="font-medium text-sm">Magic link sent.</p>
                  <p className="mt-1 text-muted-foreground text-xs">founder@example.com</p>
                </DemoVariantCard>
              </DemoVariantGrid>
            </div>

            <form className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="font-semibold text-xl">Sign in</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Use the default values while you wire the provider.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor={emailId}>
                    <Mail aria-label="Email" className="h-4 w-4" role="img" />
                    Email
                  </Label>
                  <Input defaultValue="founder@example.com" id={emailId} type="email" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor={passwordId}>
                    <KeyRound aria-label="Password" className="h-4 w-4" role="img" />
                    Password
                  </Label>
                  <Input defaultValue="start-here" id={passwordId} type="password" />
                </div>
                <DemoActionButton className="w-full" icon={<Shield className="h-4 w-4" />}>
                  Continue
                </DemoActionButton>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DemoActionButton icon={<Mail className="h-4 w-4" />} variant="outline">
                    Email code
                  </DemoActionButton>
                  <DemoActionButton icon={<Phone className="h-4 w-4" />} variant="outline">
                    Phone code
                  </DemoActionButton>
                </div>
                <DemoActionButton
                  className="w-full"
                  icon={<GoogleLogo className="h-4 w-4" />}
                  variant="ghost"
                >
                  Continue with Google
                </DemoActionButton>
                <div className="rounded-md border bg-muted/30 p-3 text-muted-foreground text-sm">
                  <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading state copies the same button width during provider handoff.
                </div>
              </div>
            </form>
          </section>
        </main>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
