import { Badge } from '@vybekiit/ui/badge';
import { Input } from '@vybekiit/ui/input';
import { Bot, FileUp, Paperclip, Send, Sparkles, WandSparkles } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoAppShell } from './shared/DemoAppShell';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

const sampleAttachments = ['requirements.pdf', 'pricing-notes.md'];

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
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="fade" title="AI workspace motion pass">
        <DemoAppShell active="dashboard" title="Assistant workspace">
          <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <aside className="rounded-lg border bg-card p-5">
              <Badge className="mb-4" variant="secondary">
                AI
              </Badge>
              <h2 className="font-bold text-3xl tracking-tight">Assistant workspace</h2>
              <p className="mt-2 text-muted-foreground text-sm">
                A starter chat surface for support, onboarding, or internal operators.
              </p>
              <div className="mt-6 rounded-lg border p-3">
                <Sparkles className="mb-2 h-4 w-4 text-amber-600" />
                <p className="font-medium text-sm">Knowledge search ready</p>
                <p className="text-muted-foreground text-sm">
                  Wire embeddings before using live data.
                </p>
              </div>
              <div className="mt-3 rounded-lg border p-3">
                <FileUp className="mb-2 h-4 w-4 text-primary" />
                <p className="font-medium text-sm">File uploads</p>
                <p className="text-muted-foreground text-sm">
                  Attach PDFs, images, and notes before sending a prompt.
                </p>
              </div>
            </aside>
            <div className="flex min-h-[560px] flex-col rounded-lg border bg-card">
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
                <div className="grid gap-2 sm:grid-cols-2">
                  {sampleAttachments.map((file) => (
                    <div
                      className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                      key={file}
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t p-4">
                <label
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-3 text-muted-foreground text-sm hover:bg-muted"
                  htmlFor="ai-assistant-file-upload"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach files
                </label>
                <Input
                  className="sr-only"
                  id="ai-assistant-file-upload"
                  multiple={true}
                  type="file"
                />
                <div className="flex gap-2">
                  <Input defaultValue="What should I do next?" />
                  <DemoActionButton icon={<Send className="h-4 w-4" />}>Send</DemoActionButton>
                </div>
              </div>
            </div>
          </section>

          <DemoVariantGrid
            className="mt-6"
            description="Compare assistant states, file attachments, and prompt actions."
            title="AI component variants"
          >
            <DemoVariantCard label="Prompt action" tone="primary">
              <WandSparkles className="mb-2 h-5 w-5 text-primary" />
              <p className="font-semibold">Generate next steps</p>
              <p className="text-muted-foreground text-sm">Strong action with icon-first button.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Attachment" tone="muted">
              <Paperclip className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium text-sm">requirements.pdf</p>
              <p className="text-muted-foreground text-xs">Small metadata row.</p>
            </DemoVariantCard>
            <DemoVariantCard label="Assistant reply" tone="accent">
              <Bot className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">I found 3 launch blockers.</p>
              <p className="text-muted-foreground text-sm">Bubble style under palette stress.</p>
            </DemoVariantCard>
          </DemoVariantGrid>
        </DemoAppShell>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
