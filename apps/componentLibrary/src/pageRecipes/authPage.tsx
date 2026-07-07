import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { useId } from 'react';

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

  // TODO: Connect this form to the active Supabase auth provider.
  // TODO: Connect phone and email-code buttons to the configured auth methods.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
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
              <Label htmlFor={emailId}>Email</Label>
              <Input defaultValue="founder@example.com" id={emailId} type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={passwordId}>Password</Label>
              <Input defaultValue="start-here" id={passwordId} type="password" />
            </div>
            <Button className="w-full" type="button">
              Continue
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline">
                Email code
              </Button>
              <Button type="button" variant="outline">
                Phone code
              </Button>
            </div>
            <Button className="w-full" type="button" variant="ghost">
              Continue with Google
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
};
