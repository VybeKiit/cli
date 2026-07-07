import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Input } from '@vybekiit/ui/input';
import { Bot, Sparkles } from 'lucide-react';

/**
 * Render a source-backed AI assistant page recipe.
 *
 * @returns A ready AI assistant page component for chat or smart replies.
 * @example
 * const element = <AiAssistantPage />;
 */
export const AiAssistantPage = () => {
  // TODO: Connect messages to the configured AI provider and conversation table.
  // TODO: Connect retrieval to the embeddings preset when knowledge search is enabled.
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border bg-card p-5">
          <Badge className="mb-4" variant="secondary">
            AI
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight">Assistant workspace</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            A starter chat surface for support, onboarding, or internal operators.
          </p>
          <div className="mt-6 rounded-lg border p-3">
            <Sparkles className="mb-2 h-4 w-4 text-amber-600" />
            <p className="font-medium text-sm">Knowledge search ready</p>
            <p className="text-muted-foreground text-sm">Wire embeddings before using live data.</p>
          </div>
        </aside>
        <div className="flex min-h-[520px] flex-col rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold">AI assistant</h2>
            </div>
          </div>
          <div className="flex-1 space-y-3 p-4">
            <div className="max-w-[80%] rounded-lg bg-muted p-3 text-sm">
              Ask about a workflow, support case, or app setup step.
            </div>
            <div className="ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-primary-foreground text-sm">
              Draft a launch checklist for my product.
            </div>
          </div>
          <div className="flex gap-2 border-t p-4">
            <Input defaultValue="What should I do next?" />
            <Button type="button">Send</Button>
          </div>
        </div>
      </section>
    </main>
  );
};
