'use client';

import { buildAssistantUsage, resolveUpgradeUrl } from '@vybekiit/assistant-chat';
import {
  type ChatStatus,
  type OutgoingAttachment,
  useAssistantCapabilities,
  useAssistantChat,
  useAssistantChoice,
  useAssistantModels,
  useAssistantPanelPosition,
  usePageContext,
} from '@vybekiit/assistant-chat/web';
import { buildAssistantDeepLink, type VybeAssistant } from '@vybekiit/report-mode';
import { useWalkthrough } from '@vybekiit/walkthrough/web';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@vybekiit-template-web/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@vybekiit-template-web/components/ai-elements/message';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorTrigger,
} from '@vybekiit-template-web/components/ai-elements/model-selector';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@vybekiit-template-web/components/ai-elements/prompt-input';
import {
  assistantLabel,
  BuilderAssistantMark,
} from '@vybekiit-template-web/components/builder-assistant-mark';
import { Walkthrough } from '@vybekiit-template-web/components/walkthrough';
import type { ChatStatus as AiChatStatus } from 'ai';
import { GripVerticalIcon, HelpCircleIcon, MoonIcon, SendIcon, SunIcon, XIcon } from 'lucide-react';
import { ThemeProvider, useTheme } from 'next-themes';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SwitchAgentIcon } from '@/components/ui/CustomIcons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ASSISTANT_TUTORIAL_STEPS } from './assistant-chat-tutorial-copy';

const ASSISTANTS: readonly VybeAssistant[] = ['claude', 'codex', 'cursor'];
const SESSION_ID = 'landing-dev';
const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 560;
const TUTORIAL_STORAGE_KEY = 'vybe-assistant-chat-tutorial';

function toPromptInputStatus(status: ChatStatus): AiChatStatus {
  switch (status) {
    case 'starting':
      return 'submitted';
    case 'streaming':
      return 'streaming';
    case 'error':
      return 'error';
    default:
      return 'ready';
  }
}

/** Human-readable byte size, e.g. 2048 → "2 KB". */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || Number.isInteger(value) ? 0 : 1)} ${units[unit]}`;
}

/** Approximate the decoded byte size of a `data:<mime>;base64,<data>` URL from its base64 length. */
function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  let padding = 0;
  if (base64.endsWith('==')) {
    padding = 2;
  } else if (base64.endsWith('=')) {
    padding = 1;
  }
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/** Convert an AI Elements FileUIPart (data URL) into the hook's outgoing attachment shape. */
function toOutgoingAttachment(
  file: PromptInputMessage['files'][number],
): OutgoingAttachment | null {
  const url = file.url ?? '';
  const dataBase64 = url.startsWith('data:') ? (url.split(',')[1] ?? '') : '';
  if (!dataBase64) {
    return null;
  }
  return {
    filename: file.filename ?? 'attachment',
    mediaType: file.mediaType ?? 'application/octet-stream',
    url,
    size: dataUrlByteSize(url),
    dataBase64,
  };
}

/** Three-dot bubble shown while the assistant is thinking but hasn't streamed a token yet. */
function TypingDots() {
  return (
    <span aria-label="Assistant is typing" className="flex items-center gap-1 py-1" role="status">
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </span>
  );
}

interface AssistantChatPanelProps {
  readonly defaultAssistant: VybeAssistant;
  readonly bridgeUrl: string;
  readonly referralCode?: string;
  readonly onClose: () => void;
}

function PanelThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  );
}

/** Inline thumbnail (images) or labeled chip (other files) with a human-readable size. */
function AttachmentPreview({
  attachment,
}: {
  readonly attachment: { filename: string; mediaType: string; url: string; size: number };
}) {
  const isImage = attachment.mediaType.startsWith('image/');
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-1.5">
      {isImage ? (
        // biome-ignore lint/performance/noImgElement: dev-only tool, data-URL preview, no next/image loader.
        <img
          alt={attachment.filename}
          className="size-10 shrink-0 rounded object-cover"
          src={attachment.url}
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-background font-mono text-[10px] text-muted-foreground uppercase">
          {(attachment.filename.split('.').pop() ?? 'file').slice(0, 4)}
        </span>
      )}
      <span className="min-w-0 flex-1 text-[11px] leading-tight">
        <span className="block truncate font-medium text-foreground">{attachment.filename}</span>
        <span className="text-muted-foreground">{formatBytes(attachment.size)}</span>
      </span>
    </div>
  );
}

function AssistantChatPanelBody({
  defaultAssistant,
  bridgeUrl,
  referralCode,
  onClose,
}: AssistantChatPanelProps) {
  const { assistant, setAssistant } = useAssistantChoice(defaultAssistant);
  const context = usePageContext();
  const { messages, status, error, send } = useAssistantChat({ bridgeUrl, sessionId: SESSION_ID });
  const { data: capabilities } = useAssistantCapabilities(bridgeUrl);
  const { data: modelsData, loading: modelsLoading } = useAssistantModels(bridgeUrl, assistant);
  const { resolved, onDragPointerDown } = useAssistantPanelPosition(PANEL_WIDTH, PANEL_HEIGHT);
  const walkthrough = useWalkthrough({
    storageKey: TUTORIAL_STORAGE_KEY,
    totalSteps: ASSISTANT_TUTORIAL_STEPS.length,
  });
  const [modelId, setModelId] = useState<string | undefined>();

  const capability = capabilities?.assistants.find((entry) => entry.id === assistant);
  const isCursor = assistant === 'cursor';
  const modelPickerEnabled = capability?.modelPicker ?? false;
  const isBusy = status === 'streaming' || status === 'starting';

  const models = modelsData?.models ?? [];
  const selectedModel = useMemo(() => {
    if (!modelId) {
      return models.find((model) => model.default) ?? models[0];
    }
    return models.find((model) => model.id === modelId) ?? models[0];
  }, [modelId, models]);

  useEffect(() => {
    const preferred = models.find((model) => model.default) ?? models[0];
    setModelId(preferred?.id);
  }, [models]);

  const usage = buildAssistantUsage(assistant);
  const upgradeUrl = resolveUpgradeUrl(assistant, referralCode);

  function onSubmit(message: PromptInputMessage, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.text.trim();
    const attachments = message.files
      .map(toOutgoingAttachment)
      .filter((item): item is OutgoingAttachment => item !== null);
    if (!text && attachments.length === 0) {
      return;
    }
    if (isCursor) {
      globalThis.open(buildAssistantDeepLink('cursor', '', text), '_blank');
      return;
    }
    send(
      text,
      context,
      {
        assistant,
        ...(selectedModel?.id ? { model: selectedModel.id } : {}),
      },
      attachments,
    );
  }

  let submitLabel: ReactNode;
  if (isCursor) {
    submitLabel = 'Open';
  } else if (!isBusy) {
    submitLabel = <SendIcon className="size-4" />;
  }

  return (
    <aside
      className={cn(
        'vybe-assistant-panel fixed z-[2147483000] flex flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl',
        'dark:bg-background dark:text-foreground',
      )}
      style={{
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        left: resolved.x,
        top: resolved.y,
      }}
    >
      <header
        className="flex cursor-grab items-center gap-2 border-border border-b px-3 py-2 active:cursor-grabbing"
        onPointerDown={onDragPointerDown}
      >
        <span
          aria-hidden="true"
          className="text-muted-foreground/60"
          data-walkthrough="drag-handle"
          title="Drag to move this panel"
        >
          <GripVerticalIcon className="size-4" />
        </span>
        <BuilderAssistantMark
          active={true}
          assistant={assistant}
          className="size-7"
          working={isBusy}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">{assistantLabel(assistant)}</p>
          <p className="flex min-h-4 items-center gap-1.5 text-[11px] text-muted-foreground">
            {isBusy ? (
              <>
                <Spinner aria-label="Assistant is responding" className="size-3.5" />
                typing…
              </>
            ) : (
              'dev chat'
            )}
          </p>
        </div>
        <Button
          aria-label="Replay the walkthrough"
          onClick={walkthrough.replay}
          size="icon"
          type="button"
          variant="ghost"
        >
          <HelpCircleIcon className="size-4" />
        </Button>
        <PanelThemeToggle />
        <Button
          aria-label="Close assistant chat"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-border border-b px-3 py-2 text-[11px] text-muted-foreground">
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <Button
              className="gap-1.5"
              data-walkthrough="switch-agent"
              size="sm"
              type="button"
              variant="outline"
            >
              <SwitchAgentIcon className="size-3.5" />
              Switch agent
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ASSISTANTS.map((entry) => (
              <DropdownMenuItem key={entry} onClick={() => setAssistant(entry)}>
                <span className="flex items-center gap-2">
                  <BuilderAssistantMark
                    active={entry === assistant}
                    assistant={entry}
                    className="size-4"
                  />
                  {assistantLabel(entry)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {modelPickerEnabled ? (
          <ModelSelector>
            <ModelSelectorTrigger asChild={true}>
              <Button disabled={modelsLoading} size="sm" type="button" variant="outline">
                {selectedModel?.label ?? selectedModel?.id ?? 'Model'}
              </Button>
            </ModelSelectorTrigger>
            <ModelSelectorContent title="Pick a model">
              <ModelSelectorInput placeholder="Search models…" />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                <ModelSelectorGroup heading={modelsData?.source === 'live' ? 'Live' : 'Fallback'}>
                  {models.map((model) => (
                    <ModelSelectorItem
                      key={model.id}
                      onSelect={() => setModelId(model.id)}
                      value={model.id}
                    >
                      <span className="flex items-center gap-2">
                        <BuilderAssistantMark assistant={assistant} className="size-4" />
                        {model.label ?? model.id}
                      </span>
                    </ModelSelectorItem>
                  ))}
                </ModelSelectorGroup>
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
        ) : null}

        <span className="font-mono text-[10px]">{context.route}</span>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-3 p-3">
          {isCursor ? (
            <p className="text-muted-foreground text-sm">
              Cursor has no headless streaming API — prompts open in Cursor via deeplink.
            </p>
          ) : null}
          {messages.map((message, index) => (
            <Message from={message.role} key={`${message.role}-${index}`}>
              <MessageContent>
                {message.role === 'assistant' ? (
                  <div className="flex items-start gap-2">
                    <BuilderAssistantMark
                      active={true}
                      assistant={assistant}
                      className="mt-0.5 size-5"
                      working={status === 'streaming'}
                    />
                    {message.text ? (
                      <MessageResponse>{message.text}</MessageResponse>
                    ) : (
                      <TypingDots />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {message.attachments && message.attachments.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {message.attachments.map((attachment) => (
                          <AttachmentPreview
                            attachment={attachment}
                            key={`${attachment.filename}-${attachment.url.slice(-16)}`}
                          />
                        ))}
                      </div>
                    ) : null}
                    {message.text ? <MessageResponse>{message.text}</MessageResponse> : null}
                  </div>
                )}
              </MessageContent>
            </Message>
          ))}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-border border-t px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span>
            usage{' '}
            {usage.available ? (
              <span className="font-mono text-foreground">
                {usage.used}/{usage.limit} ({usage.window})
              </span>
            ) : (
              <span>unavailable</span>
            )}
          </span>
          <a
            className="font-medium text-primary hover:underline"
            href={upgradeUrl}
            rel="noreferrer"
            target="_blank"
          >
            Upgrade
          </a>
        </div>
        {capability?.reason ? <p className="mt-1">{capability.reason}</p> : null}
      </div>

      <PromptInput
        className="rounded-none border-0 border-border border-t"
        globalDrop={true}
        multiple={true}
        onSubmit={onSubmit}
      >
        <PromptInputBody>
          <PromptInputTextarea
            placeholder={
              isCursor ? 'Prompt → opens in Cursor' : `Message ${assistantLabel(assistant)}…`
            }
          />
        </PromptInputBody>
        <PromptInputFooter className="justify-between px-2 pb-2">
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger data-walkthrough="upload" />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit
            data-walkthrough="send"
            disabled={status === 'streaming'}
            status={toPromptInputStatus(status)}
          >
            {submitLabel}
          </PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>

      <Walkthrough state={walkthrough} steps={ASSISTANT_TUTORIAL_STEPS} variant="spotlight" />
    </aside>
  );
}

/** Dev-only draggable sidebar with AI Elements UI and live provider sync. */
export function AssistantChatPanel(props: AssistantChatPanelProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AssistantChatPanelBody {...props} />
    </ThemeProvider>
  );
}
