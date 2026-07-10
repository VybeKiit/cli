'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Bot, FileUp, Paperclip, Send, Sparkles, Trash2, User } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type Role = 'user' | 'assistant';

/** One chat message (mirrors ai_conversations messages). */
type ChatMessage = {
  readonly id: string;
  readonly role: Role;
  readonly body: string;
  readonly at: string;
};

/** One attachment staged for the next prompt. */
type Attachment = {
  readonly id: string;
  readonly name: string;
};

const STARTER: readonly ChatMessage[] = [
  {
    id: 'msg_01',
    role: 'assistant',
    body: 'Ask about a workflow, support case, or app setup step. I can draft checklists and summarize attachments.',
    at: 'Just now',
  },
];

const SUGGESTIONS = [
  'Draft a launch checklist for my product',
  'Summarize the attached requirements',
  'What should I wire next for payments?',
] as const;

const ASSISTANT_REPLIES = [
  'Here are three next steps: connect payments, protect private routes, then send a test email.',
  'I found two launch blockers: domain DNS is still pending, and the nightly job failed once.',
  'Based on your notes, start with customers + orders tables, then add a simple checkout flow.',
] as const;

/**
 * Interactive AI assistant: send messages, suggestions, attachments, clear thread.
 * Plug-in panel maps onto ai_conversations and embeddings.
 *
 * @returns The AI assistant recipe element.
 * @example
 * const element = <AiAssistantPage />;
 */
export const AiAssistantPage = () => {
  // TODO: Connect messages to the configured AI provider and conversation table.
  // TODO: Connect retrieval to the embeddings preset when knowledge search is enabled.
  const promptId = useId();
  const fileInputId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<readonly ChatMessage[]>(STARTER);
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<readonly Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [knowledgeOn, setKnowledgeOn] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const replyIndex = useRef(0);

  const scrollToBottom = () => {
    globalThis.requestAnimationFrame(() => {
      const node = listRef.current;
      if (node) {
        node.scrollTop = node.scrollHeight;
      }
    });
  };

  const sendMessage = (text: string) => {
    const body = text.trim();
    if (body.length < 1 || sending) {
      return;
    }
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      body:
        attachments.length > 0
          ? `${body}\n\n(Attached: ${attachments.map((file) => file.name).join(', ')})`
          : body,
      at: 'Just now',
    };
    setMessages((current) => [...current, userMsg]);
    setPrompt('');
    setAttachments([]);
    setSending(true);
    scrollToBottom();

    globalThis.setTimeout(() => {
      const reply =
        ASSISTANT_REPLIES[replyIndex.current % ASSISTANT_REPLIES.length] ?? ASSISTANT_REPLIES[0];
      replyIndex.current += 1;
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        body: knowledgeOn
          ? `${reply} (knowledge search on)`
          : `${reply} (knowledge search off — answers use chat context only)`,
        at: 'Just now',
      };
      setMessages((current) => [...current, assistantMsg]);
      setSending(false);
      setNotice('Assistant replied.');
      scrollToBottom();
    }, 800);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(prompt);
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) {
      return;
    }
    const next = Array.from(list).map((file, index) => ({
      id: `att_${Date.now()}_${index}`,
      name: file.name,
    }));
    setAttachments((current) => [...current, ...next].slice(0, 6));
    setNotice(`Attached ${next.length} file${next.length === 1 ? '' : 's'}.`);
  };

  const clearChat = () => {
    setMessages(STARTER);
    setAttachments([]);
    setPrompt('');
    setNotice('Conversation cleared.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              AI
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Assistant workspace</h1>
            <p className="max-w-xl text-muted-foreground">
              Chat with simulated replies, attach files, and toggle knowledge search.
            </p>
          </div>
          <Button onClick={clearChat} type="button" variant="outline">
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear chat
          </Button>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  aria-pressed={knowledgeOn}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    knowledgeOn ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/40',
                  )}
                  onClick={() => setKnowledgeOn((value) => !value)}
                  type="button"
                >
                  <Sparkles
                    aria-hidden="true"
                    className={cn(
                      'mb-2 h-4 w-4',
                      knowledgeOn ? 'text-amber-600' : 'text-muted-foreground',
                    )}
                  />
                  <p className="font-medium text-sm">Knowledge search</p>
                  <p className="text-muted-foreground text-xs">
                    {knowledgeOn ? 'Embeddings retrieval enabled' : 'Chat context only'}
                  </p>
                </button>
                <div className="rounded-lg border p-3">
                  <FileUp aria-hidden="true" className="mb-2 h-4 w-4 text-primary" />
                  <p className="font-medium text-sm">File uploads</p>
                  <p className="text-muted-foreground text-xs">
                    Attach PDFs, images, and notes before sending.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-medium text-xs text-muted-foreground">Suggestions</p>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      className="w-full rounded-md border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted"
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="flex min-h-[560px] flex-col overflow-hidden">
            <CardHeader className="border-b py-4">
              <div className="flex items-center gap-2">
                <Bot aria-hidden="true" className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">AI assistant</CardTitle>
                <Badge className="ml-auto font-normal" variant="secondary">
                  {messages.length} messages
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-0 p-0">
              <div className="flex-1 space-y-3 overflow-y-auto p-4" ref={listRef}>
                {messages.map((message) => (
                  <div
                    className={cn(
                      'flex gap-2',
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                    key={message.id}
                  >
                    {message.role === 'assistant' ? (
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bot aria-hidden="true" className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                      )}
                    >
                      {message.body}
                    </div>
                    {message.role === 'user' ? (
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <User aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                      </span>
                    ) : null}
                  </div>
                ))}
                {sending ? (
                  <div className="flex gap-2">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Bot aria-hidden="true" className="h-3.5 w-3.5 animate-pulse" />
                    </span>
                    <div className="rounded-lg bg-muted px-3 py-2 text-muted-foreground text-sm">
                      Thinking…
                    </div>
                  </div>
                ) : null}
              </div>

              {attachments.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t px-4 py-2">
                  {attachments.map((file) => (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                      key={file.id}
                    >
                      <Paperclip aria-hidden="true" className="h-3 w-3" />
                      <span className="max-w-[10rem] truncate">{file.name}</span>
                      <button
                        aria-label={`Remove ${file.name}`}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setAttachments((current) => current.filter((row) => row.id !== file.id))
                        }
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <form className="space-y-3 border-t p-4" onSubmit={onSubmit}>
                <label
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-3 text-muted-foreground text-sm hover:bg-muted"
                  htmlFor={fileInputId}
                >
                  <Paperclip aria-hidden="true" className="h-4 w-4" />
                  Attach files
                </label>
                <Input
                  className="sr-only"
                  id={fileInputId}
                  multiple={true}
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = '';
                  }}
                  type="file"
                />
                <div className="flex gap-2">
                  <Input
                    aria-label="Message the assistant"
                    id={promptId}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="What should I do next?"
                    value={prompt}
                  />
                  <Button disabled={sending || prompt.trim().length === 0} type="submit">
                    <Send aria-hidden="true" className="h-4 w-4" /> Send
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — send, suggestions, attachments, and clear work
              without calling a model. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset ai_conversations</code> for conversation + message
                tables.
              </li>
              <li>
                Connect Send to the configured AI provider; persist turns with{' '}
                <code>POST /api/ai/messages</code>.
              </li>
              <li>
                When knowledge search is on, run <code>vybekiit apply-preset embeddings</code> and
                retrieve chunks before the completion call.
              </li>
              <li>
                Upload attachments to storage first, then pass their URLs / ids with the prompt.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="AI workspace motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
