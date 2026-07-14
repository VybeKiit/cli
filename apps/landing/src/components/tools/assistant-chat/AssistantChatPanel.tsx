'use client';

import {
  buildAssistantUsage,
  formatContextTokens,
  formatUsdPerMTok,
  resolveModelCostMeta,
  resolveUpgradeUrl,
} from '@vybekiit/assistant-chat';
import {
  type OutgoingAttachment,
  useAssistantCapabilities,
  useAssistantChat,
  useAssistantChoice,
  useAssistantModels,
  useAssistantPanelPosition,
  usePageContext,
} from '@vybekiit/assistant-chat/web';
import { buildAssistantDeepLink, VYBE_ASSISTANTS, type VybeAssistant } from '@vybekiit/report-mode';
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
  assistantLabel,
  BuilderAssistantMark,
} from '@vybekiit-template-web/components/builder-assistant-mark';
import { Walkthrough } from '@vybekiit-template-web/components/walkthrough';
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from '@vybekiit-template-web/hooks/useDebouncedValue';
import { Effect } from 'effect';
import {
  ArrowLeftIcon,
  BoxesIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FolderIcon,
  GripVerticalIcon,
  HistoryIcon,
  InfinityIcon,
  MapIcon,
  MessageSquareIcon,
  MoonIcon,
  PaperclipIcon,
  PlayIcon,
  PlugZapIcon,
  SearchIcon,
  SendIcon,
  SunIcon,
  TerminalIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { Button } from '@/components/ui/button';
import {
  ActiveAgentCheckIcon,
  ChatPrivateWarningIcon,
  SwitchAgentIcon,
} from '@/components/ui/CustomIcons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ASSISTANT_TUTORIAL_STEPS } from './assistant-chat-tutorial-copy';
import {
  createConversation,
  deleteConversation,
  filterConversationsByAssistant,
  filterConversationsByName,
  formatConversationTime,
  formatFolderPathLabel,
  mergeResumeItems,
  nativeSessionToResumeItem,
  paginateConversations,
  RESUME_PAGE_SIZE,
  type ResumeListItem,
  type ResumeListMode,
  readConversations,
  readResumeListMode,
  type StoredConversation,
  takeConversationWindow,
  touchConversation,
  writeResumeListMode,
} from './conversationStore';
import { loadSessionTranscript } from './sessionTranscript';

/** Shared light-red close/delete affordance (no tooltip — color signals danger). */
const DESTRUCTIVE_ICON_BUTTON_CLASS =
  'bg-red-500/10 text-red-700 hover:bg-red-500/20 hover:text-red-800 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25 dark:hover:text-red-200';

const ASSISTANTS = VYBE_ASSISTANTS;
const SESSION_ID = 'landing-dev';
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 620;
/**
 * Composer field height — starts compact; grows with content so Attach/Send
 * always sit after the field (never a manual resize grip between them).
 */
const COMPOSER_TEXTAREA_MIN_PX = 44;
const COMPOSER_TEXTAREA_MAX_PX = 240;

/**
 * Chat agent → landing `LogoMarkIcon` / `LOGO_MARK_RASTERS` slug.
 * Same SSOT as `AI_CODING_AGENTS_STRIP` and `/public/brand-marks/*.webp`.
 */
const ASSISTANT_BRAND_SLUG = {
  claude: 'claude',
  codex: 'codex',
  cursor: 'cursor',
  kiro: 'kiro',
  kimi: 'kimi',
  devin: 'devin',
  grok: 'grok',
} as const satisfies Record<VybeAssistant, string>;

/**
 * Official agent mark from the landing brand-marks SSOT (WebP via LogoMarkIcon).
 *
 * @param props - Agent id and optional className.
 * @returns Raster brand mark used across the landing page.
 * @example
 * <AssistantBrandMark assistant="cursor" className="size-4" />
 */
const AssistantBrandMark = ({
  assistant,
  className,
}: {
  readonly assistant: VybeAssistant;
  readonly className?: string;
}) => (
  <LogoMarkIcon
    slug={ASSISTANT_BRAND_SLUG[assistant]}
    {...(className === undefined ? {} : { className })}
  />
);
/** Floating panel sits very high; portaled menus must clear it when not nested. */
const PANEL_Z_INDEX = 2_147_483_000;
const PANEL_POPOVER_Z_CLASS = 'z-[2147483600]';
const TUTORIAL_STORAGE_KEY = 'vybe-assistant-chat-tutorial';
const THEME_STORAGE_KEY = 'vybe-assistant-chat-theme';
/** One-liner the vibe coder pastes to start the helper process. */
const BRIDGE_START_COMMAND = 'pnpm --filter @vybekiit/assistant-chat bridge';

type PanelTheme = 'light' | 'dark';

/** Light semantic tokens owned by the panel (isolates from `html.dark`). */
const PANEL_LIGHT_TOKENS = {
  '--background': '0 0% 100%',
  '--foreground': '0 0% 3.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 3.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 3.9%',
  '--primary': '0 0% 9%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96.1%',
  '--secondary-foreground': '0 0% 9%',
  '--muted': '0 0% 96.1%',
  '--muted-foreground': '0 0% 45.1%',
  '--accent': '0 0% 96.1%',
  '--accent-foreground': '0 0% 9%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 89.8%',
  '--input': '0 0% 89.8%',
  '--ring': '0 0% 3.9%',
} as const satisfies Record<string, string>;

/** Dark semantic tokens owned by the panel. */
const PANEL_DARK_TOKENS = {
  '--background': '0 0% 3.9%',
  '--foreground': '0 0% 98%',
  '--card': '0 0% 3.9%',
  '--card-foreground': '0 0% 98%',
  '--popover': '0 0% 3.9%',
  '--popover-foreground': '0 0% 98%',
  '--primary': '0 0% 98%',
  '--primary-foreground': '0 0% 9%',
  '--secondary': '0 0% 14.9%',
  '--secondary-foreground': '0 0% 98%',
  '--muted': '0 0% 14.9%',
  '--muted-foreground': '0 0% 63.9%',
  '--accent': '0 0% 14.9%',
  '--accent-foreground': '0 0% 98%',
  '--destructive': '0 62.8% 30.6%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 14.9%',
  '--input': '0 0% 14.9%',
  '--ring': '0 0% 83.1%',
} as const satisfies Record<string, string>;

/**
 * Build layout + theme CSS variables for the floating assistant panel.
 *
 * @param theme - Panel light/dark preference.
 * @param position - Fixed coordinates and size.
 * @returns Style object for the panel root.
 * @example
 * const style = panelRootStyle('dark', { x: 0, y: 0 });
 */
const panelRootStyle = (
  theme: PanelTheme,
  position: { readonly x: number; readonly y: number },
  size: { readonly width: number; readonly height: number },
): CSSProperties => ({
  ...(theme === 'dark' ? PANEL_DARK_TOKENS : PANEL_LIGHT_TOKENS),
  width: size.width,
  height: size.height,
  left: position.x,
  top: position.y,
  colorScheme: theme,
});

/**
 * Read the panel-local theme preference without touching `html` class.
 *
 * @returns Stored panel theme, or light when unset.
 * @example
 * const theme = readPanelTheme();
 */
const readPanelTheme = (): PanelTheme => {
  if (typeof globalThis.localStorage === 'undefined') {
    return 'light';
  }
  try {
    const stored = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

/**
 * Persist panel-local theme.
 *
 * @param theme - Theme to store.
 * @returns Nothing.
 * @example
 * writePanelTheme('dark');
 */
const writePanelTheme = (theme: PanelTheme): void => {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }
  try {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
};

type LaunchAgentResponse = {
  readonly ok: boolean;
  readonly command?: string;
  readonly message?: string;
  readonly launched?: boolean;
};

/**
 * Parse a fetch Response as JSON without throwing DOCTYPE HTML as a user-facing error.
 *
 * @param response - Fetch response that should be JSON.
 * @returns Parsed object, or null when the body is not JSON.
 * @example
 * const body = await parseJsonResponse<LaunchAgentResponse>(response);
 */
const parseJsonResponse = async <T,>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!(contentType.includes('application/json') || text.trimStart().startsWith('{'))) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

/**
 * Ask the landing Next server to open a real terminal with the agent CLI.
 *
 * @param input - Assistant, mode, and optional prompt/session.
 * @returns Launch result from the API.
 * @example
 * await launchAgentViaApi({ assistant: 'grok', mode: 'new' });
 */
const launchAgentViaApi = async (input: {
  readonly assistant: VybeAssistant;
  readonly mode: 'new' | 'resume';
  readonly prompt?: string;
  readonly sessionId?: string;
  /** Project folder for the CLI session (so Terminal opens in the right repo). */
  readonly cwd?: string;
}): Promise<LaunchAgentResponse> => {
  try {
    const response = await fetch('/api/dev/launch-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await parseJsonResponse<LaunchAgentResponse>(response);
    if (body === null) {
      return {
        ok: false,
        message: response.ok
          ? 'Could not read the launch response. Try again in a moment.'
          : `Could not open Terminal (${String(response.status)}). Try again.`,
      };
    }
    return body;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Launch request failed.';
    // Never show raw HTML/JSON parse noise to vibe coders.
    if (message.includes('JSON') || message.includes('<!DOCTYPE')) {
      return { ok: false, message: 'Could not open Terminal. Try again in a moment.' };
    }
    return { ok: false, message };
  }
};

/** Minimum time the agent-switch loading UI stays visible so it doesn’t flash. */
const AGENT_SWITCH_MIN_MS = 420;

/** Human-readable byte size, e.g. 2048 → "2 KB". */
const formatBytes = (bytes: number): string => {
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
};

/**
 * Short subtitle for the attachment lightbox by preview kind.
 *
 * @param kind - Image, PDF, live URL, or generic file.
 * @returns Caption shown under the attachment title.
 * @example
 * attachmentPreviewKindLabel('pdf') // → 'PDF preview'
 */
const attachmentPreviewKindLabel = (kind: 'image' | 'pdf' | 'url' | 'file'): string => {
  if (kind === 'image') {
    return 'Image preview';
  }
  if (kind === 'pdf') {
    return 'PDF preview';
  }
  if (kind === 'url') {
    return 'Live URL preview';
  }
  return 'File details';
};

/**
 * Conversation title from a loaded session: prefer server title, else trim last user text.
 *
 * @param serverTitle - Optional title from the hydrate response.
 * @param lastUserText - Last user message body as a fallback.
 * @returns Title for the conversation list.
 * @example
 * conversationTitleFromHydrate(undefined, 'Hello world') // → 'Hello world'
 */
const conversationTitleFromHydrate = (
  serverTitle: string | undefined,
  lastUserText: string,
): string => {
  if (serverTitle !== undefined && serverTitle.length > 0) {
    return serverTitle;
  }
  if (lastUserText.length > 48) {
    return `${lastUserText.slice(0, 48).trim()}…`;
  }
  return lastUserText;
};

/**
 * Resume list header when not loading: search matches vs all chats.
 *
 * @param searchQuery - Debounced search string (trimmed when empty).
 * @param count - Number of resume candidates.
 * @returns Header label for the resume list.
 * @example
 * resumeListCountLabel('', 3) // → 'Chats (3)'
 */
const resumeListCountLabel = (searchQuery: string, count: number): string => {
  if (searchQuery.trim().length > 0) {
    return `Matches (${count})`;
  }
  return `Chats (${count})`;
};

/**
 * Hint for a resume row from CLI vs in-panel history.
 *
 * @param source - Whether the row is a CLI session or a saved panel chat.
 * @param cwd - Working directory when known for CLI rows.
 * @returns Tooltip / panel-hint label.
 * @example
 * resumeRowHintLabel('cli', '/tmp/app') // → 'Resume · /tmp/app'
 */
const resumeRowHintLabel = (
  source: 'cli' | string,
  cwd: string | undefined,
  formatFolderPath: (path: string) => string,
): string => {
  if (source !== 'cli') {
    return 'Open this saved chat';
  }
  if (cwd !== undefined && cwd.length > 0) {
    return `Resume · ${formatFolderPath(cwd)}`;
  }
  return 'Resume this CLI session';
};

/**
 * Read the payload after the first comma in a data URL.
 *
 * @param dataUrl - Data URL to inspect.
 * @returns Base64 payload or an empty string when no payload exists.
 * @example
 * const payload = dataUrlPayload('data:text/plain;base64,SGk=');
 */
const dataUrlPayload = (dataUrl: string): string => {
  const payload = dataUrl.split(',')[1];
  return payload === undefined ? '' : payload;
};

/**
 * Read a File as a data URL for the bridge attachment payload.
 *
 * @param file - Browser File from the attach picker.
 * @returns Data URL string.
 * @example
 * const url = await readFileAsDataUrl(file);
 */
const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Could not read file.'));
    };
    reader.readAsDataURL(file);
  });

/**
 * Fit the composer textarea height to its content between min and max.
 * Buttons stay in the row after the field; no CSS resize handle between them.
 *
 * @param el - Live composer textarea.
 * @param minPx - Empty / single-line height.
 * @param maxPx - Cap so the message list keeps room; scrolls past this.
 * @example
 * fitComposerTextareaHeight(textarea, 44, 240);
 */
const fitComposerTextareaHeight = (el: HTMLTextAreaElement, minPx: number, maxPx: number): void => {
  el.style.height = 'auto';
  const next = Math.min(Math.max(el.scrollHeight, minPx), maxPx);
  el.style.height = `${next}px`;
  el.style.overflowY = el.scrollHeight > maxPx ? 'auto' : 'hidden';
};

/**
 * Convert a staged browser File into the hook's outgoing attachment shape.
 *
 * @param file - File selected in the composer.
 * @returns Outgoing attachment, or null when the file cannot be encoded.
 * @example
 * const attachment = await fileToOutgoingAttachment(file);
 */
const fileToOutgoingAttachment = async (file: File): Promise<OutgoingAttachment | null> => {
  try {
    const url = await readFileAsDataUrl(file);
    const dataBase64 = url.startsWith('data:') ? dataUrlPayload(url) : '';
    if (dataBase64.length === 0) {
      return null;
    }
    return {
      filename: file.name.length > 0 ? file.name : 'attachment',
      mediaType: file.type.length > 0 ? file.type : 'application/octet-stream',
      url,
      size: file.size,
      dataBase64,
    };
  } catch {
    return null;
  }
};

/** One file staged in the composer before send. */
type StagedAttachment = {
  readonly id: string;
  readonly file: File;
  /** Object URL for image/PDF thumbnail + lightbox (revoked on remove). */
  readonly previewUrl: string | null;
};

/** What the big attachment dialog should render. */
type AttachmentPreviewKind = 'image' | 'pdf' | 'url' | 'file';

/** Payload for the full-screen attachment lightbox above the floating panel. */
type AttachmentLightboxTarget = {
  readonly title: string;
  readonly mediaType: string;
  readonly url: string;
  readonly size?: number;
  /** When true, revoke `url` after the dialog closes (temporary object URL). */
  readonly revokeOnClose?: boolean;
};

/**
 * Whether a local File should keep an object URL for thumbnail / lightbox.
 *
 * @param file - Browser file from the attach picker.
 * @returns True for images and PDFs.
 * @example
 * createsLocalPreviewUrl(file);
 */
const createsLocalPreviewUrl = (file: File): boolean => {
  if (file.type.startsWith('image/')) {
    return true;
  }
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return true;
  }
  return false;
};

/**
 * Pick how to render an attachment in the large preview dialog.
 *
 * @param mediaType - MIME type when known.
 * @param url - Data URL, blob URL, or remote https URL.
 * @param filename - Display name (extension fallback).
 * @returns Preview kind for the lightbox body.
 * @example
 * resolveAttachmentPreviewKind('image/png', url, 'shot.png');
 */
const resolveAttachmentPreviewKind = (
  mediaType: string,
  url: string,
  filename: string,
): AttachmentPreviewKind => {
  if (mediaType.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(filename)) {
    return 'image';
  }
  if (
    mediaType === 'application/pdf' ||
    mediaType.includes('pdf') ||
    filename.toLowerCase().endsWith('.pdf')
  ) {
    return 'pdf';
  }
  if (/^https?:\/\//i.test(url)) {
    return 'url';
  }
  return 'file';
};

/** Three-dot bubble shown while the assistant is thinking but hasn't streamed a token yet. */
const TypingDots = () => (
  <span aria-label="Assistant is typing" className="flex items-center gap-1 py-1" role="status">
    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
  </span>
);

interface AssistantChatPanelProps {
  readonly defaultAssistant: VybeAssistant;
  readonly bridgeUrl: string;
  readonly referralCode?: string;
  readonly onClose: () => void;
}

type AssistantModel = Readonly<{
  readonly id: string;
  readonly label?: string | undefined;
  readonly default?: boolean | undefined;
}>;

/**
 * Header control tooltip — elevated above the floating panel stacking context.
 *
 * @param props - Label + trigger control.
 * @returns Tooltip-wrapped children.
 * @example
 * <PanelHeaderHint label="Replay the tour"><Button /></PanelHeaderHint>
 */
const PanelHeaderHint = ({
  label,
  children,
  className,
}: {
  readonly label: string;
  readonly children: ReactNode;
  /** Optional shell class — use for stretch/flex layouts (e.g. tall delete buttons). */
  readonly className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild={true}>
      <span className={cn('inline-flex max-w-full', className)}>{children}</span>
    </TooltipTrigger>
    <TooltipContent
      className={cn(
        PANEL_POPOVER_Z_CLASS,
        'max-w-[12rem] border border-border bg-popover px-2.5 py-1.5 text-center font-medium text-popover-foreground text-xs leading-snug shadow-lg',
      )}
      side="bottom"
      sideOffset={6}
      style={{ zIndex: PANEL_Z_INDEX + 600 }}
    >
      {label}
    </TooltipContent>
  </Tooltip>
);

const PanelThemeToggle = ({
  theme,
  onToggle,
}: {
  readonly theme: PanelTheme;
  readonly onToggle: () => void;
}) => {
  const isDark = theme === 'dark';
  return (
    <PanelHeaderHint label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <Button
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        data-no-drag="true"
        data-testid="assistant-panel-theme-toggle"
        onClick={onToggle}
        onPointerDown={(event) => event.stopPropagation()}
        size="icon"
        type="button"
        variant="ghost"
      >
        {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      </Button>
    </PanelHeaderHint>
  );
};

/**
 * Inline thumbnail (images) or labeled chip (other files). Click opens the large dialog.
 *
 * @param props - Attachment row + open handler.
 * @returns Clickable attachment chip.
 * @example
 * <AttachmentPreview attachment={row} onOpen={setLightbox} />
 */
const AttachmentPreview = ({
  attachment,
  onOpen,
}: {
  readonly attachment: { filename: string; mediaType: string; url: string; size: number };
  readonly onOpen: (target: AttachmentLightboxTarget) => void;
}) => {
  const isImage = attachment.mediaType.startsWith('image/');
  const isPdf =
    attachment.mediaType === 'application/pdf' ||
    attachment.mediaType.includes('pdf') ||
    attachment.filename.toLowerCase().endsWith('.pdf');

  return (
    <button
      className="flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/40 p-1.5 text-start transition-colors hover:border-ring/50 hover:bg-muted/70"
      onClick={() =>
        onOpen({
          title: attachment.filename,
          mediaType: attachment.mediaType,
          url: attachment.url,
          size: attachment.size,
        })
      }
      type="button"
    >
      {isImage ? (
        // biome-ignore lint/performance/noImgElement: dev-only tool, data-URL preview, no next/image loader.
        <img alt="" className="size-10 shrink-0 rounded object-cover" src={attachment.url} />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-background font-mono text-xs text-muted-foreground uppercase">
          {isPdf ? (
            <FileTextIcon aria-hidden="true" className="size-4" />
          ) : (
            attachmentExtension(attachment.filename).slice(0, 4)
          )}
        </span>
      )}
      <span className="min-w-0 flex-1 text-xs leading-tight">
        <span className="block truncate font-medium text-foreground">{attachment.filename}</span>
        <span className="text-muted-foreground">
          {formatBytes(attachment.size)} · click to enlarge
        </span>
      </span>
    </button>
  );
};

/**
 * Full-screen attachment dialog above the floating chat panel (image / PDF / live URL iframe).
 *
 * @param props - Target payload, panel theme, and close handler.
 * @returns Portaled dialog, or null when document is unavailable.
 * @example
 * <AttachmentLightbox target={row} theme="dark" onClose={() => setTarget(null)} />
 */
const AttachmentLightbox = ({
  target,
  theme,
  onClose,
}: {
  readonly target: AttachmentLightboxTarget;
  readonly theme: PanelTheme;
  readonly onClose: () => void;
}) => {
  const kind = resolveAttachmentPreviewKind(target.mediaType, target.url, target.title);
  const canOpenExternally =
    target.url.startsWith('http://') ||
    target.url.startsWith('https://') ||
    target.url.startsWith('blob:') ||
    target.url.startsWith('data:');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(
    () => () => {
      if (target.revokeOnClose === true) {
        URL.revokeObjectURL(target.url);
      }
    },
    [target],
  );

  if (typeof document === 'undefined') {
    return null;
  }

  const surfaceStyle: CSSProperties = {
    ...(theme === 'dark' ? PANEL_DARK_TOKENS : PANEL_LIGHT_TOKENS),
    colorScheme: theme,
    zIndex: PANEL_Z_INDEX + 800,
  };

  let body: ReactNode;
  if (kind === 'image') {
    body = (
      // biome-ignore lint/performance/noImgElement: lightbox for local/data attachment previews
      <img
        alt={target.title}
        className="mx-auto max-h-[min(70vh,720px)] max-w-full rounded-lg object-contain"
        src={target.url}
      />
    );
  } else if (kind === 'pdf' || kind === 'url') {
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-[11px] text-muted-foreground leading-snug">
          {kind === 'url'
            ? 'Live page preview. Some sites block embeds — use Open if this stays blank.'
            : 'PDF preview. Use Open if your browser cannot show the file here.'}
        </p>
        <iframe
          className="min-h-[min(70vh,640px)] w-full flex-1 rounded-lg border border-border bg-background"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-downloads"
          src={target.url}
          title={target.title}
        />
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
        <FileTextIcon aria-hidden="true" className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium text-foreground text-sm">{target.title}</p>
          {target.size === undefined ? null : (
            <p className="text-muted-foreground text-xs">{formatBytes(target.size)}</p>
          )}
          <p className="text-muted-foreground text-xs">
            No inline preview for this file type — open it externally if you need a full view.
          </p>
        </div>
      </div>
    );
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-3 sm:p-6',
        theme === 'dark' && 'dark',
      )}
      data-theme={theme}
      style={surfaceStyle}
    >
      <button
        aria-label="Close attachment preview"
        className="absolute inset-0 cursor-pointer border-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="assistant-attachment-lightbox-title"
        aria-modal="true"
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-background p-4 text-foreground shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-sm" id="assistant-attachment-lightbox-title">
              {target.title}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {attachmentPreviewKindLabel(kind)}
              {target.size === undefined ? '' : ` · ${formatBytes(target.size)}`}
            </p>
          </div>
          {canOpenExternally ? (
            <Button
              asChild={true}
              className="h-8 shrink-0 gap-1.5 px-2.5"
              size="sm"
              variant="outline"
            >
              <a href={target.url} rel="noreferrer" target="_blank">
                <ExternalLinkIcon className="size-3.5" />
                Open
              </a>
            </Button>
          ) : null}
          <Button
            aria-label="Close"
            className="size-8 shrink-0"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{body}</div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * Read a display extension from an attachment filename.
 *
 * @param filename - Uploaded filename.
 * @returns Extension or a generic file label.
 * @example
 * const extension = attachmentExtension('report.pdf');
 */
const attachmentExtension = (filename: string): string => {
  const extension = filename.split('.').pop();
  return extension === undefined || extension.length === 0 ? 'file' : extension;
};

/**
 * Pick the default model or first model.
 *
 * @param models - Models available for the selected assistant.
 * @returns Preferred model when any model exists.
 * @example
 * const model = preferredModel(models);
 */
const preferredModel = (models: readonly AssistantModel[]): AssistantModel | undefined => {
  const defaultModel = models.find((model) => model.default);
  return defaultModel === undefined ? models[0] : defaultModel;
};

/**
 * Format a model label for picker controls.
 *
 * @param model - Optional selected model.
 * @returns Display label for the model picker.
 * @example
 * const label = modelLabel(selectedModel);
 */
const modelLabel = (model: AssistantModel | undefined): string => {
  if (model === undefined) {
    return 'Model';
  }

  return model.label === undefined ? model.id : model.label;
};

/**
 * One model row in the picker: name + cost/context chips matching the panel card style.
 *
 * @param props - Model, agent, and selected state.
 * @returns Card-shaped model option content.
 * @example
 * <ModelPickerRow assistant="claude" model={model} selected={true} />
 */
/**
 * Pricing chip with a plain-language tooltip (Context / In / Out).
 *
 * @param props - Label, value chips, and tooltip copy.
 * @returns Chip trigger + tooltip.
 */
const ModelCostChip = ({
  label,
  children,
  tip,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly tip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild={true}>
      <span className="inline-flex cursor-help items-center gap-1 rounded-lg border border-border/70 bg-background/80 px-2 py-0.5 font-medium text-[11px] text-foreground">
        <span className="text-muted-foreground">{label}</span>
        {children}
      </span>
    </TooltipTrigger>
    <TooltipContent
      className={cn(
        PANEL_POPOVER_Z_CLASS,
        'max-w-[14rem] border border-border bg-popover px-2.5 py-1.5 text-center font-medium text-popover-foreground text-xs leading-snug shadow-lg',
      )}
      side="top"
      sideOffset={6}
      style={{ zIndex: PANEL_Z_INDEX + 700 }}
    >
      {tip}
    </TooltipContent>
  </Tooltip>
);

const ModelPickerRow = ({
  assistant,
  model,
  selected,
}: {
  readonly assistant: VybeAssistant;
  readonly model: AssistantModel;
  readonly selected: boolean;
}) => {
  const cost = resolveModelCostMeta(assistant, model.id);
  return (
    <span
      className={cn(
        'flex w-full min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 text-start transition-colors',
        selected
          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-sm'
          : 'border-border/80 bg-muted/30 hover:bg-muted/55',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <AssistantBrandMark assistant={assistant} className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-semibold text-foreground text-sm leading-tight">
          {modelLabel(model)}
        </span>
        {selected ? (
          <span className="flex shrink-0 items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <span className="relative flex size-3.5 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-[-2px] animate-ping rounded-full bg-emerald-500/40"
                style={{ animationDuration: '1.35s' }}
              />
              <ActiveAgentCheckIcon className="relative size-3.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <span className="font-semibold text-[10px] uppercase tracking-wide">Active</span>
          </span>
        ) : null}
      </span>

      {cost === null ? (
        <span className="text-[11px] text-muted-foreground leading-snug">
          Opens in {assistantLabel(assistant)} · cost depends on your plan
        </span>
      ) : (
        <span className="flex flex-wrap gap-1.5">
          <ModelCostChip
            label="Context"
            tip="How much of the conversation and files this model can hold at once (max window)."
          >
            <span className="tabular-nums">{formatContextTokens(cost.contextTokens)}</span>
          </ModelCostChip>
          <ModelCostChip
            label="In"
            tip="API price for tokens you send to the model (your prompt + context), per million tokens."
          >
            <span className="tabular-nums">{formatUsdPerMTok(cost.inputPerMTokUsd)}</span>
            <span className="text-muted-foreground">/MTok</span>
          </ModelCostChip>
          <ModelCostChip
            label="Out"
            tip="API price for tokens the model writes back (the reply), per million tokens."
          >
            <span className="tabular-nums">{formatUsdPerMTok(cost.outputPerMTokUsd)}</span>
            <span className="text-muted-foreground">/MTok</span>
          </ModelCostChip>
        </span>
      )}
      {cost?.pricingNote === undefined ? null : (
        <span className="text-[10px] text-muted-foreground leading-snug">{cost.pricingNote}</span>
      )}
    </span>
  );
};

/**
 * Copy the bridge start command for a vibe coder who needs the helper online.
 *
 * @returns Nothing.
 * @example
 * await copyBridgeCommand();
 */
const copyBridgeCommand = async (): Promise<boolean> => {
  try {
    await globalThis.navigator.clipboard.writeText(BRIDGE_START_COMMAND);
    return true;
  } catch {
    return false;
  }
};

/**
 * Connection status shown under the agent name.
 *
 * @param connected - Whether the EventSource is open.
 * @param isBusy - Whether a reply is in flight.
 * @returns Short status label for the header.
 * @example
 * const label = headerStatusLabel(true, false);
 */
const headerStatusLabel = (connected: boolean, isBusy: boolean): string => {
  if (isBusy) {
    return 'Working…';
  }
  if (connected) {
    return 'Ready';
  }
  return 'Not connected';
};

/**
 * Friendly empty state when the helper process is offline.
 *
 * @param agentName - Active agent label for the heading.
 * @returns Offline empty-state card.
 * @example
 * <OfflineEmptyState agentName="Claude Code" />
 */
const OfflineEmptyState = ({ agentName }: { readonly agentName: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void copyBridgeCommand().then((ok) => {
      if (!ok) {
        return;
      }
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 px-5 py-8 text-center"
      data-testid="assistant-offline-empty"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <PlugZapIcon aria-hidden="true" className="size-6" />
      </div>
      <div className="space-y-1.5">
        <p className="font-semibold text-foreground text-sm">
          {agentName} isn&apos;t connected yet
        </p>
        <p className="max-w-[16rem] text-muted-foreground text-xs leading-relaxed">
          Local dev usually starts this for you. If it didn&apos;t, run the command below once and
          leave that terminal open.
        </p>
      </div>
      <div className="w-full max-w-[18rem] space-y-2 rounded-xl border border-border bg-muted/50 p-3 text-start">
        <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Backup command
        </p>
        <code className="block break-all rounded-lg bg-background px-2.5 py-2 font-mono text-[11px] text-foreground leading-snug">
          {BRIDGE_START_COMMAND}
        </code>
        <Button
          className="w-full gap-1.5"
          onClick={handleCopy}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3.5" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              Copy command
            </>
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Or use <span className="font-medium">New chat</span> → Terminal below.
      </p>
    </div>
  );
};

/** Empty-state starter tips — one row of three equal cards when the panel is wide enough. */
const WELCOME_STARTER_TIPS = [
  {
    id: 'describe',
    icon: MessageSquareIcon,
    label: 'Describe what you want to change on this landing page',
  },
  {
    id: 'screenshot',
    icon: PaperclipIcon,
    label: 'Drop a screenshot so the agent can see what you see',
  },
  {
    id: 'terminal',
    icon: TerminalIcon,
    label: 'Use New chat if you prefer a full terminal session',
  },
] as const;

/**
 * Skeleton rows for Resume while native CLI sessions load.
 *
 * @param count - How many placeholder rows to show.
 * @returns Shimmer list.
 * @example
 * <ResumeListSkeleton count={5} />
 */
const ResumeListSkeleton = ({ count = 5 }: { readonly count?: number }) => (
  <ul aria-busy="true" aria-label="Loading chats" className="space-y-1.5">
    {Array.from({ length: count }, (_, index) => (
      <li
        className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 px-2 py-2.5"
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
        key={index}
      >
        <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-[70%]" />
          <Skeleton className="h-3 w-[90%]" />
          <Skeleton className="h-2.5 w-[45%]" />
        </div>
        <Skeleton className="h-3 w-10 shrink-0" />
      </li>
    ))}
  </ul>
);

/**
 * Full-panel loading state while switching coding agents (models + chat context).
 *
 * @param agentName - Human label for the agent being loaded.
 * @param assistant - Agent id for the brand mark.
 * @returns Centered spinner + shimmer blocks.
 * @example
 * <AgentSwitchLoadingState agentName="Grok" assistant="grok" />
 */
const AgentSwitchLoadingState = ({
  agentName,
  assistant,
}: {
  readonly agentName: string;
  readonly assistant: VybeAssistant;
}) => (
  <div
    aria-busy="true"
    aria-live="polite"
    className="flex h-full flex-col gap-4 px-3 py-4"
    data-testid="assistant-agent-switch-loading"
  >
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="relative">
        <AssistantBrandMark assistant={assistant} className="size-10 opacity-90" />
        <span className="absolute -end-1 -bottom-1 flex size-5 items-center justify-center rounded-full border border-border bg-background shadow-sm">
          <Spinner aria-hidden="true" className="size-3 text-muted-foreground" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground text-sm">Switching to {agentName}…</p>
        <p className="max-w-[16rem] text-muted-foreground text-xs leading-relaxed">
          Loading this helper’s models and chats. Hang tight.
        </p>
      </div>
    </div>
    <div aria-hidden="true" className="space-y-3">
      <div className="flex items-start gap-2">
        <Skeleton className="size-5 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-[85%]" />
          <Skeleton className="h-3 w-[60%]" />
        </div>
      </div>
      <div className="ms-auto w-[75%] space-y-1.5">
        <Skeleton className="ms-auto h-3 w-full" />
        <Skeleton className="ms-auto h-3 w-[70%]" />
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="size-5 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-[90%]" />
          <Skeleton className="h-3 w-[55%]" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Welcome empty state when the helper is online but no turns yet.
 *
 * @param assistant - Active agent (Claude Code uses the responsive “Shipped it” pose).
 * @param agentName - Active agent label.
 * @param streamsInPanel - Whether chat streams in-panel vs terminal-only.
 * @returns Welcome empty-state card.
 * @example
 * <WelcomeEmptyState assistant="claude" agentName="Claude Code" streamsInPanel={true} />
 */
const WelcomeEmptyState = ({
  assistant,
  agentName,
  streamsInPanel,
}: {
  readonly assistant: VybeAssistant;
  readonly agentName: string;
  readonly streamsInPanel: boolean;
}) => (
  <div
    className="flex h-full min-h-0 flex-col items-center justify-center gap-3 overflow-y-auto px-3 py-4 text-center sm:gap-4 sm:px-5 sm:py-6"
    data-testid="assistant-welcome-empty"
  >
    <div
      aria-hidden="true"
      className="flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center overflow-visible"
      data-testid="assistant-welcome-mascot"
    >
      {assistant === 'claude' ? (
        /* Responsive mark pose “Shipped it” (celebrating rig) — not the full scene card. */
        <BuilderAssistantMark assistant="claude" pose="celebrating" size="xxl" />
      ) : (
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <BuilderAssistantMark active={true} assistant={assistant} size="xxl" working={true} />
        </span>
      )}
    </div>
    <div className="min-w-0 shrink space-y-1 px-1">
      <p className="font-semibold text-foreground text-sm">Chat with {agentName}</p>
      <p className="mx-auto max-w-[20rem] text-muted-foreground text-xs leading-relaxed">
        {streamsInPanel
          ? 'Ask anything about this page. Attach a screenshot if it helps.'
          : `${agentName} opens in your Terminal — type a prompt here and hit send.`}
      </p>
    </div>
    {/*
      auto-fit + minmax: one row of 3 equal cards when width allows,
      then 2 → 1 as the panel shrinks (resize-friendly, not viewport-only).
    */}
    <ul
      className="grid w-full max-w-full gap-2"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 6.75rem), 1fr))',
      }}
    >
      {WELCOME_STARTER_TIPS.map((tip) => {
        const Icon = tip.icon;
        return (
          <li
            className="flex min-h-0 flex-col items-center justify-start gap-1.5 rounded-xl border border-border/80 bg-muted/30 px-2 py-2.5 text-center text-[11px] text-muted-foreground leading-snug"
            key={tip.id}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background/70 text-foreground/80 shadow-sm ring-1 ring-border/60">
              <Icon aria-hidden="true" className="size-3.5" />
            </span>
            <span className="min-w-0 text-balance">{tip.label}</span>
          </li>
        );
      })}
    </ul>
  </div>
);

const AssistantChatPanelBody = ({
  defaultAssistant,
  bridgeUrl,
  referralCode,
  onClose,
}: AssistantChatPanelProps) => {
  const { assistant, setAssistant } = useAssistantChoice(defaultAssistant);
  const context = usePageContext();
  const [sessionId, setSessionId] = useState(() => {
    const existing = readConversations()[0];
    return existing?.id ?? createConversation({ assistant: defaultAssistant }).id;
  });
  const [conversations, setConversations] = useState<readonly StoredConversation[]>(() =>
    readConversations(),
  );
  const { messages, status, error, connected, send, hydrateMessages } = useAssistantChat({
    bridgeUrl,
    sessionId,
  });
  /** Cancels an older transcript request before a newer Resume selection can replace it. */
  const transcriptRequestRef = useRef<AbortController | null>(null);
  /** True while loading CLI history into the panel after Resume. */
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const { data: capabilities } = useAssistantCapabilities(bridgeUrl);
  const { data: modelsData, loading: modelsLoading } = useAssistantModels(bridgeUrl, assistant);
  const { resolved, size, onDragPointerDown, onResizePointerDown } = useAssistantPanelPosition(
    PANEL_WIDTH,
    PANEL_HEIGHT,
  );
  const walkthrough = useWalkthrough({
    storageKey: TUTORIAL_STORAGE_KEY,
    totalSteps: ASSISTANT_TUTORIAL_STEPS.length,
  });
  const [modelId, setModelId] = useState<string | undefined>();
  const [panelTheme, setPanelTheme] = useState<PanelTheme>(() => readPanelTheme());
  const [launchNote, setLaunchNote] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [resumeSearch, setResumeSearch] = useState('');
  /** Debounced query for fuzzy filter (input stays live; list filters after pause). */
  const debouncedResumeSearch = useDebouncedValue(resumeSearch, SEARCH_DEBOUNCE_MS);
  /** Pages vs infinite scroll — preference survives panel remounts. */
  const [resumeListMode, setResumeListMode] = useState<ResumeListMode>(() => readResumeListMode());
  const [resumePage, setResumePage] = useState(1);
  /** How many filtered rows infinite mode has revealed so far. */
  const [resumeVisibleCount, setResumeVisibleCount] = useState(RESUME_PAGE_SIZE);
  const resumeListScrollRef = useRef<HTMLUListElement | null>(null);
  const resumeLoadMoreRef = useRef<HTMLLIElement | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  /**
   * Saved chat waiting on delete confirmation. Null when the dialog is closed.
   * Only panel-saved rows can be deleted (CLI sessions stay on disk).
   */
  const [pendingDelete, setPendingDelete] = useState<{
    readonly id: string;
    readonly title: string;
  } | null>(null);
  /** Native CLI sessions for the active agent (Resume sheet). */
  const [nativeSessions, setNativeSessions] = useState<readonly ResumeListItem[]>([]);
  const [nativeSessionsLoading, setNativeSessionsLoading] = useState(false);
  /** True while switching agents — show skeleton so the switch feels intentional. */
  const [agentSwitching, setAgentSwitching] = useState(false);
  const agentSwitchStartedAt = useRef(0);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [bridgeStarting, setBridgeStarting] = useState(true);
  const [draft, setDraft] = useState('');
  const [stagedFiles, setStagedFiles] = useState<readonly StagedAttachment[]>([]);
  const [attachmentLightbox, setAttachmentLightbox] = useState<AttachmentLightboxTarget | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const draftFieldId = useId();
  const agentCloseTimer = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  /** Keep textarea height in sync with draft (including clear after send). */
  // biome-ignore lint/correctness/useExhaustiveDependencies: draft is the re-fit trigger (height reads from the DOM)
  useLayoutEffect(() => {
    const el = composerTextareaRef.current;
    if (el === null) {
      return;
    }
    fitComposerTextareaHeight(el, COMPOSER_TEXTAREA_MIN_PX, COMPOSER_TEXTAREA_MAX_PX);
  }, [draft]);

  const stagedFilesRef = useRef(stagedFiles);
  stagedFilesRef.current = stagedFiles;

  /** Revoke object URLs when the panel unmounts (per-remove cleanup is separate). */
  useEffect(
    () => () => {
      for (const staged of stagedFilesRef.current) {
        if (staged.previewUrl !== null) {
          URL.revokeObjectURL(staged.previewUrl);
        }
      }
    },
    [],
  );

  /** Start the coding helper automatically in local dev (no manual terminal required). */
  useEffect(() => {
    let cancelled = false;
    const ensure = async (): Promise<void> => {
      try {
        await fetch('/api/dev/ensure-bridge', { method: 'POST' });
      } catch {
        // EventSource will surface offline empty state if this fails.
      } finally {
        if (!cancelled) {
          setBridgeStarting(false);
        }
      }
    };
    void ensure();
    // Retry once after a short delay if the first paint was before the server was ready.
    const retry = globalThis.setTimeout(() => {
      void ensure();
    }, 1500);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(retry);
    };
  }, []);

  const refreshConversations = useCallback(() => {
    setConversations(readConversations());
  }, []);

  /**
   * Load on-disk CLI sessions for the active agent (official store paths).
   * Agent-scoped only — other agents never appear in this list.
   */
  const refreshNativeSessions = useCallback(async (agent: VybeAssistant): Promise<void> => {
    setNativeSessionsLoading(true);
    try {
      const response = await fetch(`/api/dev/list-sessions?assistant=${encodeURIComponent(agent)}`);
      if (!response.ok) {
        setNativeSessions([]);
        return;
      }
      const body = await parseJsonResponse<{
        readonly sessions?: readonly {
          readonly sessionId: string;
          readonly title: string;
          readonly assistant: VybeAssistant;
          readonly updatedAt: string;
          readonly cwd?: string;
          readonly sourcePath?: string;
        }[];
      }>(response);
      if (body === null) {
        setNativeSessions([]);
        return;
      }
      const rows = (body.sessions ?? []).map((session) =>
        nativeSessionToResumeItem({
          sessionId: session.sessionId,
          title: session.title,
          assistant: session.assistant,
          updatedAt: session.updatedAt,
          ...(session.cwd === undefined ? {} : { cwd: session.cwd }),
          ...(session.sourcePath === undefined ? {} : { sourcePath: session.sourcePath }),
        }),
      );
      setNativeSessions(rows);
    } catch {
      setNativeSessions([]);
    } finally {
      setNativeSessionsLoading(false);
    }
  }, []);

  const handleHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      onDragPointerDown(event);
    },
    [onDragPointerDown],
  );

  const openAgentMenu = useCallback(() => {
    if (agentCloseTimer.current !== null) {
      globalThis.clearTimeout(agentCloseTimer.current);
      agentCloseTimer.current = null;
    }
    setAgentMenuOpen(true);
  }, []);

  const scheduleCloseAgentMenu = useCallback(() => {
    if (agentCloseTimer.current !== null) {
      globalThis.clearTimeout(agentCloseTimer.current);
    }
    agentCloseTimer.current = globalThis.setTimeout(() => {
      setAgentMenuOpen(false);
      agentCloseTimer.current = null;
    }, 160);
  }, []);

  useEffect(
    () => () => {
      if (agentCloseTimer.current !== null) {
        globalThis.clearTimeout(agentCloseTimer.current);
      }
    },
    [],
  );

  /** Body-portaled menus sit outside the panel; re-apply panel tokens + solid fill. */
  const popoverSurfaceStyle = useMemo(
    (): CSSProperties => ({
      ...(panelTheme === 'dark' ? PANEL_DARK_TOKENS : PANEL_LIGHT_TOKENS),
      colorScheme: panelTheme,
      zIndex: PANEL_Z_INDEX + 600,
      backgroundColor: panelTheme === 'dark' ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
    }),
    [panelTheme],
  );

  /**
   * Model picker Dialog portals to `document.body` with default z-50, which sits
   * under this panel (z ~2e9). Raise overlay + content above the panel.
   */
  const modelDialogContentStyle = useMemo(
    (): CSSProperties => ({
      ...(panelTheme === 'dark' ? PANEL_DARK_TOKENS : PANEL_LIGHT_TOKENS),
      colorScheme: panelTheme,
      zIndex: PANEL_Z_INDEX + 700,
      backgroundColor: panelTheme === 'dark' ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
    }),
    [panelTheme],
  );
  const modelDialogOverlayStyle = useMemo(
    (): CSSProperties => ({
      zIndex: PANEL_Z_INDEX + 650,
    }),
    [],
  );
  /** Delete-confirm dialog sits above the panel + Resume sheet. */
  const deleteDialogContentStyle = useMemo(
    (): CSSProperties => ({
      ...(panelTheme === 'dark' ? PANEL_DARK_TOKENS : PANEL_LIGHT_TOKENS),
      colorScheme: panelTheme,
      zIndex: PANEL_Z_INDEX + 750,
      backgroundColor: panelTheme === 'dark' ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
    }),
    [panelTheme],
  );
  const deleteDialogOverlayStyle = useMemo(
    (): CSSProperties => ({
      zIndex: PANEL_Z_INDEX + 720,
    }),
    [],
  );

  const capability = capabilities?.assistants.find((entry) => entry.id === assistant);
  const openMode =
    capability?.openMode ??
    (assistant === 'claude' || assistant === 'codex' || assistant === 'kimi' || assistant === 'grok'
      ? 'stream'
      : 'terminal');
  const streamsInPanel = openMode === 'stream';
  const modelPickerEnabled = capability?.modelPicker === true;
  const isBusy = status === 'streaming' || status === 'starting' || launching;
  const agentName = assistantLabel(assistant);
  const hasMessages = messages.length > 0;
  const showOfflineEmpty = !(
    connected ||
    hasMessages ||
    launchNote ||
    bridgeStarting ||
    transcriptLoading
  );
  const showWelcomeEmpty =
    connected && !hasMessages && !launchNote && streamsInPanel && !transcriptLoading;
  const showConnecting =
    bridgeStarting && !connected && !hasMessages && !launchNote && !transcriptLoading;
  /** Native CLI session linked to the active chat (daemon passes this as --resume / --session). */
  const activeAgentSessionId = useMemo(() => {
    const row = conversations.find((chat) => chat.id === sessionId);
    const id = row?.terminalSessionId;
    return id !== undefined && id.length > 0 ? id : undefined;
  }, [conversations, sessionId]);

  /**
   * Whether a given assistant streams in-panel (daemon) rather than Terminal/deeplink.
   * Uses live capabilities when available, with the same stream fallback as openMode.
   */
  const assistantStreamsInPanel = useCallback(
    (id: VybeAssistant): boolean => {
      const entry = capabilities?.assistants.find((item) => item.id === id);
      if (entry !== undefined) {
        return entry.openMode === 'stream';
      }
      return id === 'claude' || id === 'codex' || id === 'kimi' || id === 'grok';
    },
    [capabilities],
  );

  /**
   * Clear agent-switch loading once models settle (or non-model agents are ready)
   * and a short minimum time has elapsed so the skeleton is readable.
   */
  useEffect(() => {
    if (!agentSwitching) {
      return;
    }
    const modelsReady = !modelsLoading;
    if (!modelsReady) {
      return;
    }
    const elapsed = Date.now() - agentSwitchStartedAt.current;
    const remaining = Math.max(0, AGENT_SWITCH_MIN_MS - elapsed);
    const timer = globalThis.setTimeout(() => {
      setAgentSwitching(false);
    }, remaining);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [agentSwitching, modelsLoading]);

  const models: readonly AssistantModel[] =
    modelsData === undefined || modelsData === null ? [] : modelsData.models;
  const selectedModel = useMemo(() => {
    if (!modelId) {
      return preferredModel(models);
    }
    const matched = models.find((model) => model.id === modelId);
    return matched === undefined ? models[0] : matched;
  }, [modelId, models]);

  useEffect(() => {
    const preferred = preferredModel(models);
    setModelId(preferred?.id);
  }, [models]);

  // Keep the active conversation preview in sync with the latest user turn.
  useEffect(() => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (lastUser === undefined || lastUser.text.length === 0) {
      return;
    }
    const title =
      lastUser.text.length > 48 ? `${lastUser.text.slice(0, 48).trim()}…` : lastUser.text;
    touchConversation(sessionId, { title, preview: lastUser.text, assistant });
    refreshConversations();
  }, [assistant, messages, refreshConversations, sessionId]);

  const usage = buildAssistantUsage(assistant);
  const upgradeUrl = resolveUpgradeUrl(assistant, referralCode);

  const toggleTheme = (): void => {
    setPanelTheme((current) => {
      const next: PanelTheme = current === 'dark' ? 'light' : 'dark';
      writePanelTheme(next);
      return next;
    });
  };

  const openInTerminal = async (input: {
    readonly mode: 'new' | 'resume';
    readonly prompt?: string;
    readonly terminalSessionId?: string;
    readonly launchAssistant?: VybeAssistant;
    readonly cwd?: string;
  }): Promise<void> => {
    setLaunching(true);
    setLaunchNote(null);
    const launchResponse = await launchAgentViaApi({
      assistant: input.launchAssistant || assistant,
      mode: input.mode,
      ...(input.prompt ? { prompt: input.prompt } : {}),
      ...(input.terminalSessionId ? { sessionId: input.terminalSessionId } : {}),
      ...(input.cwd ? { cwd: input.cwd } : {}),
    });
    setLaunching(false);
    if (!launchResponse.ok) {
      setLaunchNote(launchResponse.message || 'Launch failed.');
      return;
    }

    if (launchResponse.launched) {
      setLaunchNote(launchResponse.message || 'Opened in Terminal.');
      return;
    }

    let launchMessage = launchResponse.message || 'Could not auto-open Terminal.';
    if (launchResponse.command) {
      launchMessage += ` Run: ${launchResponse.command}`;
    }
    setLaunchNote(launchMessage);
  };

  const handleStartNewInPanel = (): void => {
    const row = createConversation({
      assistant,
      title: 'New chat',
      preview: 'Empty chat — send a message to get started.',
    });
    setSessionId(row.id);
    setLaunchNote(null);
    refreshConversations();
    setNewChatOpen(false);
  };

  const handleStartNewInTerminal = (): void => {
    const row = createConversation({
      assistant,
      title: `Terminal · ${agentName}`,
      preview: 'Opened in Terminal.',
    });
    setSessionId(row.id);
    refreshConversations();
    setNewChatOpen(false);
    void openInTerminal({ mode: 'new' });
  };

  /**
   * Load full CLI history into the panel (Claude/Grok transcripts today).
   * Always links agentSessionId for the next send; history is best-effort.
   */
  const hydrateNativeTranscript = useCallback(
    async (input: {
      readonly assistant: VybeAssistant;
      readonly terminalSessionId: string;
      /** Panel conversation id to update (not the CLI session id). */
      readonly panelSessionId: string;
      readonly sourcePath?: string;
      readonly folderHint: string;
    }): Promise<void> => {
      if (transcriptRequestRef.current) {
        transcriptRequestRef.current.abort();
      }
      const requestController = new AbortController();
      transcriptRequestRef.current = requestController;
      setTranscriptLoading(true);
      setLaunchNote(`Loading full conversation${input.folderHint}…`);
      try {
        // Wait a tick so useAssistantChat can clear for the new panel session id first.
        await new Promise<void>((resolve) => {
          globalThis.setTimeout(() => resolve(), 0);
        });
        const transcriptEither = await Effect.runPromise(
          Effect.either(
            loadSessionTranscript(
              input.terminalSessionId,
              input.assistant,
              requestController.signal,
              input.sourcePath,
            ),
          ),
        );
        if (requestController.signal.aborted) {
          return;
        }
        if (transcriptEither._tag === 'Left') {
          setLaunchNote(
            `Could not load past messages${input.folderHint}. Send a message to continue this session in chat.`,
          );
          return;
        }
        const transcript = transcriptEither.right;
        const loaded = transcript.messages;
        if (loaded.length === 0) {
          setLaunchNote(
            `No past messages found${input.folderHint}. Send a message to continue in chat.`,
          );
          return;
        }
        hydrateMessages(loaded.map((message) => ({ role: message.role, text: message.text })));
        const lastUser = [...loaded].reverse().find((message) => message.role === 'user');
        if (lastUser !== undefined) {
          touchConversation(input.panelSessionId, {
            title: conversationTitleFromHydrate(transcript.title, lastUser.text),
            preview: lastUser.text,
            assistant: input.assistant,
          });
          refreshConversations();
        }
        setLaunchNote(
          `Loaded ${String(loaded.length)} messages${input.folderHint}. Send to continue where you left off.`,
        );
      } catch {
        if (requestController.signal.aborted) {
          return;
        }
        setLaunchNote(
          `Could not load past messages${input.folderHint}. Send a message to continue this session in chat.`,
        );
      } finally {
        if (transcriptRequestRef.current === requestController) {
          setTranscriptLoading(false);
        }
      }
    },
    [hydrateMessages, refreshConversations],
  );

  const handleOpenConversation = (row: ResumeListItem | StoredConversation): void => {
    const source = 'source' in row ? row.source : 'saved';
    if (source === 'cli') {
      const terminalSessionId = row.terminalSessionId;
      if (terminalSessionId === undefined || terminalSessionId.length === 0) {
        setLaunchNote('This CLI session is missing an id — open a new chat instead.');
        return;
      }
      // Track as a local row linked to the CLI session so every send carries agentSessionId.
      const existing = readConversations().find(
        (chat) => chat.terminalSessionId === terminalSessionId && chat.assistant === row.assistant,
      );
      const sessionCwd = row.cwd;
      const sourcePath = 'sourcePath' in row ? row.sourcePath : undefined;
      const linked =
        existing ??
        createConversation({
          assistant: row.assistant,
          title: row.title,
          preview: row.preview,
          terminalSessionId,
          ...(sessionCwd !== undefined && sessionCwd.length > 0 ? { cwd: sessionCwd } : {}),
          ...(sourcePath !== undefined && sourcePath.length > 0 ? { sourcePath } : {}),
        });
      refreshConversations();
      setAssistant(row.assistant);
      setSessionId(linked.id);
      setResumeOpen(false);
      setNewChatOpen(false);

      // Every agent: load full history into the panel. Stream agents continue here on send;
      // terminal/deeplink agents open their CLI when you send (not on Resume click).
      const folderHint =
        sessionCwd !== undefined && sessionCwd.length > 0
          ? ` (${formatFolderPathLabel(sessionCwd)})`
          : '';
      if (assistantStreamsInPanel(row.assistant)) {
        void fetch('/api/dev/ensure-bridge', { method: 'POST' }).catch(() => undefined);
      }
      void hydrateNativeTranscript({
        assistant: row.assistant,
        terminalSessionId,
        panelSessionId: linked.id,
        folderHint,
        ...(sourcePath !== undefined && sourcePath.length > 0 ? { sourcePath } : {}),
      });
      return;
    }
    setAssistant(row.assistant);
    setSessionId(row.id);
    setLaunchNote(null);
    setResumeOpen(false);
    setNewChatOpen(false);
    // Saved row already linked to a CLI session → reload history from disk.
    const linkedId = row.terminalSessionId;
    if (linkedId !== undefined && linkedId.length > 0 && assistantStreamsInPanel(row.assistant)) {
      const folderHint =
        row.cwd !== undefined && row.cwd.length > 0 ? ` (${formatFolderPathLabel(row.cwd)})` : '';
      void hydrateNativeTranscript({
        assistant: row.assistant,
        terminalSessionId: linkedId,
        panelSessionId: row.id,
        folderHint,
        ...(row.sourcePath !== undefined && row.sourcePath.length > 0
          ? { sourcePath: row.sourcePath }
          : {}),
      });
    }
  };

  const handleRequestDeleteConversation = (row: {
    readonly id: string;
    readonly title: string;
  }): void => {
    setPendingDelete({ id: row.id, title: row.title });
  };

  const handleCancelDeleteConversation = (): void => {
    setPendingDelete(null);
  };

  /**
   * Permanently remove a panel-saved chat after the confirm dialog.
   * Does not touch native CLI sessions on disk (those stay for Resume).
   */
  const handleConfirmDeleteConversation = (): void => {
    if (pendingDelete === null) {
      return;
    }
    const id = pendingDelete.id;
    setPendingDelete(null);
    deleteConversation(id);
    refreshConversations();
    if (id === sessionId) {
      const remaining = readConversations();
      // Prefer another chat for the same agent so delete never jumps you to a different agent.
      const sameAgent = remaining.find((row) => row.assistant === assistant);
      const next = sameAgent ?? remaining[0];
      if (next === undefined) {
        const row = createConversation({ assistant });
        setSessionId(row.id);
        refreshConversations();
      } else {
        setSessionId(next.id);
        setAssistant(next.assistant);
      }
    }
  };

  const handleResumeSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setResumeSearch(event.target.value);
  };

  const resetResumeListWindow = useCallback((): void => {
    setResumePage(1);
    setResumeVisibleCount(RESUME_PAGE_SIZE);
  }, []);

  const handleOpenResumeSheet = (): void => {
    refreshConversations();
    setResumeSearch('');
    resetResumeListWindow();
    setResumeOpen(true);
    void refreshNativeSessions(assistant);
  };

  // When Resume is open and the active agent changes, reload that agent's CLI sessions.
  useEffect(() => {
    if (!resumeOpen) {
      return;
    }
    void refreshNativeSessions(assistant);
  }, [assistant, resumeOpen, refreshNativeSessions]);

  /** Leave the resume sheet and return to the chat the vibe coder was in. */
  const handleBackFromResume = (): void => {
    setResumeSearch('');
    resetResumeListWindow();
    setResumeOpen(false);
  };

  const handleResumeListModeChange = (mode: ResumeListMode): void => {
    setResumeListMode(mode);
    writeResumeListMode(mode);
    resetResumeListWindow();
  };

  const handleSelectAssistant = (entry: VybeAssistant): void => {
    if (entry === assistant) {
      setAgentMenuOpen(false);
      return;
    }
    agentSwitchStartedAt.current = Date.now();
    setAgentSwitching(true);
    setAssistant(entry);
    setAgentMenuOpen(false);
    setLaunchNote(null);
    setDraft('');
    // Resume / panel context is per agent — open that agent's latest chat (or start empty).
    // Do not re-tag the previous agent's conversation onto the new agent.
    const forAgent = filterConversationsByAssistant(readConversations(), entry);
    const latest = forAgent[0];
    if (latest !== undefined) {
      setSessionId(latest.id);
      return;
    }
    const row = createConversation({
      assistant: entry,
      title: 'New chat',
      preview: 'Empty chat — send a message to get started.',
    });
    setSessionId(row.id);
    refreshConversations();
  };

  const handleSelectModel = (id: string): void => {
    setModelId(id);
  };

  const clearStagedFiles = useCallback(() => {
    setStagedFiles((current) => {
      for (const staged of current) {
        if (staged.previewUrl !== null) {
          URL.revokeObjectURL(staged.previewUrl);
        }
      }
      return [];
    });
  }, []);

  const removeStagedFile = useCallback((id: string) => {
    setStagedFiles((current) => {
      const found = current.find((entry) => entry.id === id);
      if (found?.previewUrl !== null && found?.previewUrl !== undefined) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const addStagedFiles = useCallback((fileList: FileList | readonly File[]) => {
    const incoming = [...fileList];
    if (incoming.length === 0) {
      return;
    }
    setStagedFiles((current) => {
      const next = incoming.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: createsLocalPreviewUrl(file) ? URL.createObjectURL(file) : null,
      })) satisfies readonly StagedAttachment[];
      return [...current, ...next];
    });
  }, []);

  const openStagedAttachment = useCallback((staged: StagedAttachment): void => {
    const mediaType = staged.file.type.length > 0 ? staged.file.type : 'application/octet-stream';
    if (staged.previewUrl !== null) {
      setAttachmentLightbox({
        title: staged.file.name,
        mediaType,
        url: staged.previewUrl,
        size: staged.file.size,
      });
      return;
    }
    const temporaryUrl = URL.createObjectURL(staged.file);
    setAttachmentLightbox({
      title: staged.file.name,
      mediaType,
      url: temporaryUrl,
      size: staged.file.size,
      revokeOnClose: true,
    });
  }, []);

  const closeAttachmentLightbox = useCallback((): void => {
    setAttachmentLightbox(null);
  }, []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files !== null) {
        addStagedFiles(event.target.files);
      }
      event.target.value = '';
    },
    [addStagedFiles],
  );

  const sendMessage = async (): Promise<void> => {
    const text = draft.trim();
    if (!text && stagedFiles.length === 0 && streamsInPanel) {
      return;
    }

    if (openMode === 'deeplink') {
      const url = buildAssistantDeepLink(assistant, '', text);
      if (url !== null) {
        globalThis.open(url, '_blank');
        setLaunchNote(`Opened ${agentName} via deeplink.`);
        setDraft('');
        clearStagedFiles();
        return;
      }
      void openInTerminal({ mode: 'new', prompt: text });
      setDraft('');
      clearStagedFiles();
      return;
    }

    if (openMode === 'terminal') {
      void openInTerminal({ mode: 'new', prompt: text });
      setDraft('');
      clearStagedFiles();
      return;
    }

    if (!text && stagedFiles.length === 0) {
      return;
    }

    if (!connected) {
      setLaunchNote('Starting your coding helper… try send again in a second.');
      void fetch('/api/dev/ensure-bridge', { method: 'POST' });
      return;
    }

    const encoded = await Promise.all(
      stagedFiles.map((staged) => fileToOutgoingAttachment(staged.file)),
    );
    const attachments = encoded.filter((item): item is OutgoingAttachment => item !== null);

    // Prefer live localStorage so a just-linked CLI resume is not lost to React batching.
    const liveRow = readConversations().find((chat) => chat.id === sessionId);
    const liveAgentSessionId = liveRow?.terminalSessionId ?? activeAgentSessionId;
    const liveCwd = liveRow?.cwd;

    send(
      text,
      context,
      {
        assistant,
        ...(selectedModel?.id ? { model: selectedModel.id } : {}),
        ...(liveAgentSessionId !== undefined && liveAgentSessionId.length > 0
          ? { agentSessionId: liveAgentSessionId }
          : {}),
        ...(liveCwd !== undefined && liveCwd.length > 0 ? { cwd: liveCwd } : {}),
      },
      attachments,
    );
    // Clear the one-shot resume tip once the vibe coder is chatting.
    setLaunchNote(null);
    setDraft('');
    clearStagedFiles();
  };

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void sendMessage();
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void sendMessage();
  };

  let composerPlaceholder: string;
  if (!connected && streamsInPanel) {
    composerPlaceholder = bridgeStarting
      ? 'Starting coding helper…'
      : 'Connecting to coding helper…';
  } else if (streamsInPanel) {
    composerPlaceholder = `Message ${agentName}…`;
  } else {
    composerPlaceholder = `Type a prompt to open ${agentName}`;
  }

  const canSend =
    !(agentSwitching || isBusy) &&
    (draft.trim().length > 0 || stagedFiles.length > 0 || !streamsInPanel);

  let sendButtonContent: ReactNode;
  if (isBusy && streamsInPanel) {
    sendButtonContent = <Spinner className="size-4" />;
  } else if (streamsInPanel) {
    sendButtonContent = (
      <>
        <SendIcon className="size-4" />
        Send
      </>
    );
  } else if (launching) {
    sendButtonContent = <Spinner className="size-4" />;
  } else {
    sendButtonContent = 'Open';
  }

  /** Saved chats for the agent currently selected in the panel only. */
  const activeConversations = useMemo(
    () => filterConversationsByAssistant(conversations, assistant),
    [assistant, conversations],
  );
  /**
   * Resume candidates for the active agent only: panel-saved chats + native CLI
   * sessions from that agent's official on-disk store. Fuzzy search ranks the
   * full agent set; pagination / infinite scroll only window this list.
   */
  const resumeCandidates = useMemo(() => {
    const cliForAgent = nativeSessions.filter((row) => row.assistant === assistant);
    const merged = mergeResumeItems(activeConversations, cliForAgent);
    return filterConversationsByName(merged, debouncedResumeSearch, assistantLabel);
  }, [activeConversations, assistant, debouncedResumeSearch, nativeSessions]);

  const resumePageData = useMemo(
    () => paginateConversations(resumeCandidates, resumePage, RESUME_PAGE_SIZE),
    [resumeCandidates, resumePage],
  );

  const resumeVisibleRows = useMemo(() => {
    if (resumeListMode === 'pages') {
      return resumePageData.items;
    }
    return takeConversationWindow(resumeCandidates, resumeVisibleCount);
  }, [resumeCandidates, resumeListMode, resumePageData.items, resumeVisibleCount]);

  const resumeHasMoreInfinite =
    resumeListMode === 'infinite' && resumeVisibleCount < resumeCandidates.length;

  // Search re-ranks the agent set; agent switch reloads that agent's chats. Restart window.
  // biome-ignore lint/correctness/useExhaustiveDependencies: assistant + search are intentional re-rank triggers
  useEffect(() => {
    if (!resumeOpen) {
      return;
    }
    resetResumeListWindow();
  }, [assistant, debouncedResumeSearch, resumeOpen, resetResumeListWindow]);

  // Keep page index valid when deletes shrink the filtered list.
  useEffect(() => {
    if (resumeListMode !== 'pages') {
      return;
    }
    if (resumePageData.totalPages > 0 && resumePage > resumePageData.totalPages) {
      setResumePage(resumePageData.totalPages);
    }
  }, [resumeListMode, resumePage, resumePageData.totalPages]);

  // Infinite mode: load the next chunk when the sentinel enters the list viewport.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-bind when the visible window grows so a still-visible sentinel keeps loading
  useEffect(() => {
    if (!resumeOpen || resumeListMode !== 'infinite' || !resumeHasMoreInfinite) {
      return;
    }
    const root = resumeListScrollRef.current;
    const sentinel = resumeLoadMoreRef.current;
    if (root === null || sentinel === null) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setResumeVisibleCount((current) =>
            Math.min(current + RESUME_PAGE_SIZE, resumeCandidates.length),
          );
        }
      },
      { root, rootMargin: '48px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [
    resumeCandidates.length,
    resumeHasMoreInfinite,
    resumeListMode,
    resumeOpen,
    resumeVisibleCount,
  ]);

  const walkthroughPortal =
    typeof document !== 'undefined' && walkthrough.active
      ? createPortal(
          <Walkthrough
            className="vybe-walkthrough--floating-panel"
            state={walkthrough}
            steps={ASSISTANT_TUTORIAL_STEPS}
            variant="spotlight"
          />,
          document.body,
        )
      : null;

  return (
    <TooltipProvider delayDuration={280} skipDelayDuration={0}>
      <aside
        className={cn(
          'fixed flex flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl',
          'isolate',
          panelTheme === 'dark' && 'dark',
        )}
        data-theme={panelTheme}
        dir="ltr"
        style={{
          ...panelRootStyle(panelTheme, resolved, size),
          zIndex: PANEL_Z_INDEX,
          backgroundColor: panelTheme === 'dark' ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
        }}
      >
        {/* Header */}
        <header
          className="flex cursor-grab items-center gap-2 border-border border-b bg-background px-3 py-2.5 active:cursor-grabbing"
          onPointerDown={handleHeaderPointerDown}
        >
          <span
            aria-hidden="true"
            className="text-muted-foreground/60"
            data-walkthrough="drag-handle"
            title="Drag to move this panel"
          >
            <GripVerticalIcon className="size-4" />
          </span>
          <AssistantBrandMark assistant={assistant} className="size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-sm leading-tight">{agentName}</p>
            <p className="mt-0.5 flex min-h-4 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  isBusy && 'animate-pulse bg-sky-500',
                  !isBusy && connected && 'bg-emerald-500',
                  !(isBusy || connected) && 'bg-amber-500',
                )}
              />
              {agentSwitching ? (
                <>
                  <Spinner aria-label="Switching agent" className="size-3" />
                  Switching…
                </>
              ) : null}
              {!agentSwitching && isBusy ? (
                <>
                  <Spinner aria-label="Assistant is responding" className="size-3" />
                  Working…
                </>
              ) : null}
              {!(agentSwitching || isBusy) && bridgeStarting && !connected ? 'Starting…' : null}
              {agentSwitching || isBusy || (bridgeStarting && !connected)
                ? null
                : headerStatusLabel(connected, isBusy)}
            </p>
          </div>
          <p
            className="flex max-w-[9.75rem] shrink-0 items-start gap-1 rounded-md border border-amber-500/35 bg-amber-500/12 px-1.5 py-1 text-amber-950 dark:border-amber-400/35 dark:bg-amber-400/15 dark:text-amber-50"
            data-no-drag="true"
            data-testid="assistant-privacy-notice"
            data-walkthrough="privacy-notice"
            title="Private: only you see this chat. Visitors never do."
          >
            <ChatPrivateWarningIcon
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0 text-amber-600 dark:text-amber-300"
            />
            <span className="min-w-0 font-bold text-[10px] leading-snug tracking-tight">
              Private: only you. Visitors never see this.
            </span>
          </p>
          <PanelHeaderHint label="Replay the guided tour of this chat">
            <Button
              aria-label="Replay the walkthrough"
              data-no-drag="true"
              data-testid="assistant-replay-walkthrough"
              onClick={(event) => {
                event.stopPropagation();
                walkthrough.replay();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              size="icon"
              type="button"
              variant="ghost"
            >
              <MapIcon className="size-4" />
            </Button>
          </PanelHeaderHint>
          <PanelThemeToggle onToggle={toggleTheme} theme={panelTheme} />
          <Button
            aria-label="Close assistant chat"
            className={DESTRUCTIVE_ICON_BUTTON_CLASS}
            data-no-drag="true"
            data-testid="assistant-close"
            onClick={onClose}
            onPointerDown={(event) => event.stopPropagation()}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </header>

        {/* Compact action bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-border border-b bg-background px-3 py-2">
          <div onMouseEnter={openAgentMenu} onMouseLeave={scheduleCloseAgentMenu}>
            <DropdownMenu modal={false} onOpenChange={setAgentMenuOpen} open={agentMenuOpen}>
              <DropdownMenuTrigger asChild={true}>
                <Button
                  className="h-8 gap-1.5 px-2.5"
                  data-testid="assistant-switch-agent"
                  data-walkthrough="switch-agent"
                  disabled={agentSwitching}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {agentSwitching ? (
                    <Spinner aria-hidden="true" className="size-3.5" />
                  ) : (
                    <SwitchAgentIcon className="size-3.5" />
                  )}
                  <span className="max-w-[7rem] truncate">{agentName}</span>
                  <ChevronDownIcon className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className={cn(
                  PANEL_POPOVER_Z_CLASS,
                  'max-h-72 min-w-[12rem] overflow-y-auto border border-border bg-popover text-popover-foreground shadow-2xl',
                  panelTheme === 'dark' && 'dark',
                )}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onMouseEnter={openAgentMenu}
                onMouseLeave={scheduleCloseAgentMenu}
                sideOffset={6}
                style={popoverSurfaceStyle}
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Your coding agent
                </DropdownMenuLabel>
                {ASSISTANTS.map((entry) => {
                  const entryCap = capabilities?.assistants.find((item) => item.id === entry);
                  const installed = entryCap?.installed;
                  const isActive = entry === assistant;
                  return (
                    <DropdownMenuItem key={entry} onClick={() => handleSelectAssistant(entry)}>
                      <span className="flex w-full items-center gap-2">
                        <AssistantBrandMark assistant={entry} className="size-4 shrink-0" />
                        <span className="flex-1">{assistantLabel(entry)}</span>
                        {isActive ? (
                          <span className="ms-auto flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <span
                              aria-hidden="true"
                              className="relative flex size-3.5 shrink-0 items-center justify-center"
                            >
                              {/* Heartbeam pulse behind the check */}
                              <span
                                className="absolute inset-[-2px] animate-ping rounded-full bg-emerald-500/45"
                                style={{ animationDuration: '1.35s' }}
                              />
                              <span className="absolute inset-[-1px] animate-pulse rounded-full bg-emerald-400/25" />
                              <ActiveAgentCheckIcon className="relative size-3.5 text-emerald-600 dark:text-emerald-400" />
                            </span>
                            <span className="font-semibold text-xs leading-none">active</span>
                          </span>
                        ) : null}
                        {!isActive && installed === false ? (
                          <span className="text-muted-foreground text-xs">not installed</span>
                        ) : null}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <PanelHeaderHint label="Start a fresh chat in this panel or Terminal">
            <Button
              className="h-8 gap-1.5 px-2.5"
              onClick={() => {
                refreshConversations();
                setNewChatOpen(true);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <PlayIcon className="size-3.5" />
              New chat
            </Button>
          </PanelHeaderHint>

          <PanelHeaderHint label="Find chats from every folder this agent has used">
            <Button
              className="h-8 gap-1.5 px-2.5"
              data-walkthrough="resume"
              onClick={handleOpenResumeSheet}
              size="sm"
              type="button"
              variant="ghost"
            >
              <HistoryIcon className="size-3.5" />
              Resume
            </Button>
          </PanelHeaderHint>

          {modelPickerEnabled ? (
            <ModelSelector>
              <ModelSelectorTrigger asChild={true}>
                <Button
                  className="ms-auto h-8 max-w-[10.5rem] gap-1.5 px-2.5"
                  disabled={modelsLoading || agentSwitching}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {modelsLoading || agentSwitching ? (
                    <Spinner aria-hidden="true" className="size-3.5 shrink-0 opacity-80" />
                  ) : (
                    <BoxesIcon className="size-3.5 shrink-0 opacity-80" />
                  )}
                  <span className="min-w-0 truncate">
                    {modelsLoading || agentSwitching
                      ? 'Loading models…'
                      : modelLabel(selectedModel)}
                  </span>
                  <ChevronDownIcon className="size-3 shrink-0 opacity-60" />
                </Button>
              </ModelSelectorTrigger>
              <ModelSelectorContent
                className={cn(
                  PANEL_POPOVER_Z_CLASS,
                  'max-h-[min(32rem,85vh)] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl sm:rounded-2xl',
                  panelTheme === 'dark' && 'dark',
                )}
                overlayClassName="bg-black/45 backdrop-blur-[1px]"
                overlayStyle={modelDialogOverlayStyle}
                style={modelDialogContentStyle}
                title="Pick a model"
              >
                <div className="border-border border-b px-4 pt-4 pb-3">
                  <p className="font-semibold text-foreground text-sm">Pick a model</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                    Prices are USD per million tokens (API). Context is the max window.
                  </p>
                </div>
                <ModelSelectorInput
                  className="rounded-none border-0 border-border border-b px-4"
                  placeholder="Search models…"
                />
                <ModelSelectorList className="max-h-[min(22rem,60vh)] p-2">
                  <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                  <ModelSelectorGroup
                    className="space-y-3 p-0"
                    heading={
                      modelsData?.source === 'live' ? 'From your agent' : 'Suggested for this agent'
                    }
                  >
                    {models.map((model) => (
                      <ModelSelectorItem
                        className="mb-3 h-auto w-full items-stretch rounded-xl border-0 p-0 last:mb-0 data-[selected=true]:bg-transparent data-[selected=true]:text-foreground [&_svg]:size-auto"
                        key={model.id}
                        onSelect={() => handleSelectModel(model.id)}
                        value={`${model.id} ${modelLabel(model)}`}
                      >
                        <ModelPickerRow
                          assistant={assistant}
                          model={model}
                          selected={selectedModel?.id === model.id}
                        />
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                </ModelSelectorList>
                <p className="border-border border-t px-4 py-2 text-[10px] text-muted-foreground leading-snug">
                  Rates follow public Anthropic / OpenAI API pricing for {agentName}. Your
                  subscription may bill differently.
                </p>
              </ModelSelectorContent>
            </ModelSelector>
          ) : null}
        </div>

        {/* Transcript */}
        <Conversation className="min-h-0 flex-1 bg-muted/20">
          <ConversationContent className="gap-3 p-3">
            {agentSwitching ? (
              <AgentSwitchLoadingState agentName={agentName} assistant={assistant} />
            ) : null}
            {!agentSwitching && transcriptLoading ? (
              <div
                aria-busy="true"
                aria-live="polite"
                className="flex h-full flex-col gap-3 px-1 py-2"
                data-testid="assistant-transcript-loading"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Spinner aria-hidden="true" className="size-3.5" />
                  Loading full conversation…
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-14 w-[88%] rounded-2xl" />
                  <Skeleton className="ms-auto h-20 w-[82%] rounded-2xl" />
                  <Skeleton className="h-12 w-[75%] rounded-2xl" />
                  <Skeleton className="ms-auto h-16 w-[90%] rounded-2xl" />
                </div>
              </div>
            ) : null}
            {!(agentSwitching || transcriptLoading) && showConnecting ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                <Spinner className="size-6 text-muted-foreground" />
                <p className="font-medium text-foreground text-sm">Starting your coding helper…</p>
                <p className="max-w-[16rem] text-muted-foreground text-xs">
                  One moment — this happens automatically in local dev.
                </p>
              </div>
            ) : null}
            {!agentSwitching && showOfflineEmpty ? (
              <OfflineEmptyState agentName={agentName} />
            ) : null}
            {!agentSwitching && showWelcomeEmpty ? (
              <WelcomeEmptyState
                agentName={agentName}
                assistant={assistant}
                streamsInPanel={streamsInPanel}
              />
            ) : null}

            {agentSwitching || streamsInPanel || showOfflineEmpty || showConnecting ? null : (
              <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-muted-foreground text-xs leading-relaxed">
                {openMode === 'deeplink'
                  ? `${agentName} opens in its own app when you send a message.`
                  : `${agentName} runs in your Terminal — type a prompt below or hit New chat.`}
              </div>
            )}

            {!agentSwitching && launchNote ? (
              <div
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-foreground text-xs leading-relaxed"
                role="status"
              >
                {launchNote}
              </div>
            ) : null}

            {agentSwitching
              ? null
              : messages.map((message, index) => (
                  <Message from={message.role} key={`${message.role}-${index}`}>
                    <MessageContent>
                      {message.role === 'assistant' ? (
                        <div className="flex items-start gap-2">
                          <AssistantBrandMark
                            assistant={assistant}
                            className="mt-0.5 size-5 shrink-0"
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
                                  onOpen={setAttachmentLightbox}
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

            {!agentSwitching && error && hasMessages ? (
              <div
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-amber-900 text-xs leading-relaxed dark:text-amber-100"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/*
        Composer — single bordered shell: staged files + textarea + Attach/Send inside.
        Inline layout styles are intentional: PromptInput/InputGroup previously
        collapsed the field to ~1 character (placeholder stacked as M/e).
        Do not reintroduce InputGroup or ai-elements PromptInput here.
      */}
        <form
          className="shrink-0 border-border border-t bg-background"
          data-testid="assistant-composer"
          onSubmit={handleComposerSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            padding: 12,
          }}
        >
          {usage.available ? (
            <p className="text-[11px] text-muted-foreground" style={{ margin: 0, lineHeight: 1.4 }}>
              Usage{' '}
              <span className="font-mono text-foreground">
                {usage.used}/{usage.limit}
              </span>
              {' · '}
              <a
                className="font-medium text-primary hover:underline"
                href={upgradeUrl}
                rel="noreferrer"
                target="_blank"
              >
                Upgrade
              </a>
            </p>
          ) : null}

          <input
            accept="image/*,.pdf,application/pdf,text/*,.txt,.md,.json,.csv"
            className="sr-only"
            multiple={true}
            onChange={handleFileInputChange}
            ref={fileInputRef}
            tabIndex={-1}
            type="file"
          />

          <div
            className="rounded-xl border border-border bg-muted/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40"
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            {stagedFiles.length > 0 ? (
              <div
                className="flex flex-wrap gap-1.5 border-border/60 border-b px-2.5 pt-2.5 pb-2"
                style={{ width: '100%' }}
              >
                {stagedFiles.map((staged) => {
                  const isPdf =
                    staged.file.type === 'application/pdf' ||
                    staged.file.name.toLowerCase().endsWith('.pdf');
                  const isImage = staged.file.type.startsWith('image/');
                  return (
                    <div
                      className="flex max-w-full items-center gap-1 rounded-lg border border-border bg-background/80 py-0.5 pe-0.5 ps-1 text-xs text-foreground"
                      key={staged.id}
                    >
                      <button
                        className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-start hover:bg-muted/80"
                        onClick={() => openStagedAttachment(staged)}
                        title="Open larger preview"
                        type="button"
                      >
                        {isImage && staged.previewUrl !== null ? (
                          // biome-ignore lint/performance/noImgElement: local object-URL preview in dev tool
                          <img
                            alt=""
                            className="size-6 shrink-0 rounded object-cover"
                            height={24}
                            src={staged.previewUrl}
                            width={24}
                          />
                        ) : null}
                        {!(isImage && staged.previewUrl !== null) && isPdf ? (
                          <FileTextIcon
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-muted-foreground"
                          />
                        ) : null}
                        {(isImage && staged.previewUrl !== null) || isPdf ? null : (
                          <PaperclipIcon
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-muted-foreground"
                          />
                        )}
                        <span className="min-w-0 max-w-[9rem] truncate">{staged.file.name}</span>
                      </button>
                      <button
                        aria-label={`Remove ${staged.file.name}`}
                        className="shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => removeStagedFile(staged.id)}
                        type="button"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <label className="sr-only" htmlFor={draftFieldId}>
              Message for {agentName}
            </label>
            {/*
              Order is load-bearing: textarea (auto-height) first, then Attach/Send.
              Dynamic height grows the field only; action row always sits after it.
              Do not put resize:vertical on the textarea — that grip lands between
              the field and the buttons.
            */}
            <textarea
              autoComplete="off"
              className="border-0 bg-transparent text-sm text-foreground leading-relaxed placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="assistant-composer-input"
              disabled={isBusy && streamsInPanel}
              id={draftFieldId}
              name="assistant-message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={composerPlaceholder}
              ref={composerTextareaRef}
              rows={1}
              spellCheck={true}
              style={{
                display: 'block',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                minHeight: COMPOSER_TEXTAREA_MIN_PX,
                maxHeight: COMPOSER_TEXTAREA_MAX_PX,
                boxSizing: 'border-box',
                resize: 'none',
                padding: '10px 12px 2px',
                margin: 0,
                overflowX: 'hidden',
                overflowY: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
              }}
              value={draft}
            />

            <div
              className="gap-2 px-2 pb-2"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                minWidth: 0,
              }}
            >
              <Button
                className="h-8 shrink-0 gap-1.5 px-2.5"
                data-testid="assistant-attach-files"
                data-walkthrough="upload"
                disabled={isBusy && streamsInPanel}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                type="button"
                variant="ghost"
              >
                <PaperclipIcon className="size-4" />
                Attach
              </Button>

              <span
                aria-hidden="true"
                className="min-w-0 flex-1 text-[10px] text-muted-foreground"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {capability?.reason
                  ? capability.reason
                  : 'Enter to send · Shift+Enter for a new line'}
              </span>

              <Button
                className="h-8 shrink-0 gap-1.5 px-3"
                data-testid="assistant-send"
                data-walkthrough="send"
                disabled={!canSend}
                size="sm"
                type="submit"
              >
                {sendButtonContent}
              </Button>
            </div>
          </div>
        </form>

        {/* Drag corner to grow the whole panel (width + height). */}
        <button
          aria-label="Resize chat panel"
          className="absolute end-0 bottom-0 z-10 size-5 cursor-se-resize touch-none border-0 bg-transparent p-0"
          data-resize-handle="true"
          onPointerDown={onResizePointerDown}
          title="Drag to resize"
          type="button"
        >
          <span
            aria-hidden="true"
            className="absolute end-1 bottom-1 size-2.5 rounded-sm border-border border-e-2 border-b-2 opacity-60"
          />
        </button>

        {walkthroughPortal}

        {attachmentLightbox === null ? null : (
          <AttachmentLightbox
            onClose={closeAttachmentLightbox}
            target={attachmentLightbox}
            theme={panelTheme}
          />
        )}

        {/* New chat sheet (in-panel so it stays above the floating chrome) */}
        {newChatOpen ? (
          <div className="absolute inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">New chat</p>
                <p className="text-muted-foreground text-xs">
                  Start fresh with {agentName}, or open a past conversation.
                </p>
              </div>
              <Button
                aria-label="Close new chat"
                className={DESTRUCTIVE_ICON_BUTTON_CLASS}
                onClick={() => setNewChatOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <PanelHeaderHint label="Start a blank chat right here in this panel">
                <Button
                  className="w-full justify-start gap-2"
                  onClick={handleStartNewInPanel}
                  type="button"
                >
                  <MessageSquareIcon className="size-4" />
                  New chat in this panel
                </Button>
              </PanelHeaderHint>
              <PanelHeaderHint label="Open a fresh agent session in your Terminal app">
                <Button
                  className="w-full justify-start gap-2"
                  disabled={launching}
                  onClick={handleStartNewInTerminal}
                  type="button"
                  variant="outline"
                >
                  <TerminalIcon className="size-4" />
                  New chat in Terminal
                </Button>
              </PanelHeaderHint>
            </div>
            {activeConversations.length > 0 ? (
              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-hidden">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Recent with {agentName}
                </p>
                <ul className="max-h-full space-y-1 overflow-y-auto pb-2">
                  {activeConversations.map((row) => (
                    <li key={row.id}>
                      <PanelHeaderHint label="Open this saved chat">
                        <button
                          className={cn(
                            'flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-2 text-start text-sm hover:border-border hover:bg-muted/60',
                            row.id === sessionId && 'border-border bg-muted/40',
                          )}
                          onClick={() => handleOpenConversation(row)}
                          type="button"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{row.title}</p>
                            <p className="truncate text-muted-foreground text-xs">{row.preview}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatConversationTime(row.updatedAt)}
                          </span>
                        </button>
                      </PanelHeaderHint>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Resume sheet — find chats by name (no session ids for vibe coders) */}
        {resumeOpen ? (
          <div className="absolute inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-start gap-2">
              <PanelHeaderHint className="shrink-0" label="Back to your chat">
                <Button
                  aria-label="Back to chat"
                  data-testid="assistant-resume-back"
                  onClick={handleBackFromResume}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </PanelHeaderHint>
              <div className="min-w-0 flex-1 pt-1">
                <p className="font-semibold text-foreground text-sm">Resume a conversation</p>
                <p className="text-muted-foreground text-xs">
                  Only {agentName}: saved panel chats plus CLI sessions on this machine.
                </p>
              </div>
            </div>

            {activeConversations.length > 0 ||
            nativeSessions.length > 0 ||
            nativeSessionsLoading ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="relative">
                  <SearchIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    aria-label={`Search ${agentName} chats by name`}
                    className="h-9 ps-8 text-sm"
                    data-testid="assistant-resume-search"
                    disabled={nativeSessionsLoading && resumeCandidates.length === 0}
                    onChange={handleResumeSearchChange}
                    placeholder={
                      nativeSessionsLoading && resumeCandidates.length === 0
                        ? `Loading ${agentName} chats…`
                        : `Search ${agentName} chats…`
                    }
                    value={resumeSearch}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-xs">Infinite scroll</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Off = pages · On = load as you scroll. Search checks every {agentName} chat.
                    </p>
                  </div>
                  <button
                    aria-checked={resumeListMode === 'infinite'}
                    aria-label={
                      resumeListMode === 'infinite'
                        ? 'Infinite scroll on — switch to pages'
                        : 'Infinite scroll off — switch on'
                    }
                    className={cn(
                      'relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors',
                      resumeListMode === 'infinite'
                        ? 'border-primary bg-primary'
                        : 'border-border bg-input',
                    )}
                    data-testid="assistant-resume-list-mode"
                    onClick={() =>
                      handleResumeListModeChange(
                        resumeListMode === 'infinite' ? 'pages' : 'infinite',
                      )
                    }
                    role="switch"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform',
                        resumeListMode === 'infinite' ? 'start-5' : 'start-0.5',
                      )}
                    />
                    <span className="sr-only">
                      {resumeListMode === 'infinite' ? 'Infinite scroll' : 'Pages'}
                    </span>
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      {nativeSessionsLoading
                        ? 'Loading CLI sessions…'
                        : resumeListCountLabel(debouncedResumeSearch, resumeCandidates.length)}
                    </p>
                    {resumeListMode === 'infinite' && resumeCandidates.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <InfinityIcon aria-hidden="true" className="size-3" />
                        Showing {resumeVisibleRows.length} of {resumeCandidates.length}
                      </span>
                    ) : null}
                  </div>
                  {nativeSessionsLoading && resumeCandidates.length === 0 ? (
                    <div className="min-h-0 flex-1 overflow-y-auto pb-1">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                        <Spinner aria-hidden="true" className="size-3.5" />
                        Finding {agentName} chats on this machine…
                      </div>
                      <ResumeListSkeleton count={6} />
                    </div>
                  ) : null}
                  {!(nativeSessionsLoading && resumeCandidates.length === 0) &&
                  resumeCandidates.length > 0 ? (
                    <>
                      <ul
                        className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-1"
                        data-testid="assistant-resume-list"
                        ref={resumeListScrollRef}
                      >
                        {resumeVisibleRows.map((row) => (
                          <li className="flex items-stretch gap-1.5" key={row.id}>
                            <PanelHeaderHint
                              className="min-w-0 flex-1"
                              label={resumeRowHintLabel(row.source, row.cwd, formatFolderPathLabel)}
                            >
                              <button
                                className={cn(
                                  'flex h-full w-full min-w-0 items-start gap-2 rounded-lg border border-transparent px-2 py-2 text-start text-sm hover:border-border hover:bg-muted/60',
                                  row.id === sessionId && 'border-border bg-muted/40',
                                )}
                                onClick={() => handleOpenConversation(row)}
                                type="button"
                              >
                                <AssistantBrandMark
                                  assistant={row.assistant}
                                  className="mt-0.5 size-4 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="flex min-w-0 items-center gap-1.5">
                                    <span className="truncate font-medium text-foreground">
                                      {row.title}
                                    </span>
                                    {row.source === 'cli' ? (
                                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                                        <TerminalIcon aria-hidden="true" className="size-2.5" />
                                        CLI
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="truncate text-muted-foreground text-xs">
                                    {assistantLabel(row.assistant)} · {row.preview}
                                  </p>
                                  {row.cwd !== undefined && row.cwd.length > 0 ? (
                                    <p
                                      className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground/90"
                                      title={row.cwd}
                                    >
                                      <FolderIcon
                                        aria-hidden="true"
                                        className="size-2.5 shrink-0 opacity-80"
                                      />
                                      <span className="truncate font-mono">
                                        {formatFolderPathLabel(row.cwd)}
                                      </span>
                                    </p>
                                  ) : null}
                                </div>
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                  {formatConversationTime(row.updatedAt)}
                                </span>
                              </button>
                            </PanelHeaderHint>
                            {row.source === 'saved' ? (
                              <PanelHeaderHint
                                className="flex shrink-0 self-stretch"
                                label="Delete this saved chat"
                              >
                                <Button
                                  aria-label={`Delete ${row.title}`}
                                  className={cn(
                                    // Override size="icon" fixed h-9 so trash matches the chat row height.
                                    '!h-full min-h-full w-9 shrink-0 self-stretch rounded-lg p-0',
                                    DESTRUCTIVE_ICON_BUTTON_CLASS,
                                  )}
                                  data-testid={`assistant-delete-conversation-${row.id}`}
                                  onClick={() =>
                                    handleRequestDeleteConversation({
                                      id: row.id,
                                      title: row.title,
                                    })
                                  }
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                >
                                  <Trash2Icon className="size-3.5" />
                                </Button>
                              </PanelHeaderHint>
                            ) : null}
                          </li>
                        ))}
                        {resumeHasMoreInfinite ? (
                          <li
                            aria-hidden="true"
                            className="flex h-8 items-center justify-center text-[10px] text-muted-foreground"
                            ref={resumeLoadMoreRef}
                          >
                            Loading more…
                          </li>
                        ) : null}
                      </ul>

                      {resumeListMode === 'pages' && resumePageData.totalPages > 1 ? (
                        <div className="flex shrink-0 items-center justify-between gap-2 border-border border-t pt-2">
                          <Button
                            aria-label="Previous page of saved chats"
                            className="h-8 gap-1 px-2"
                            data-testid="assistant-resume-page-prev"
                            disabled={resumePageData.page <= 1}
                            onClick={() => setResumePage((page) => Math.max(1, page - 1))}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <ChevronLeftIcon className="size-3.5" />
                            Prev
                          </Button>
                          <p
                            className="text-muted-foreground text-xs tabular-nums"
                            data-testid="assistant-resume-page-label"
                          >
                            Page {resumePageData.page} of {resumePageData.totalPages}
                          </p>
                          <Button
                            aria-label="Next page of saved chats"
                            className="h-8 gap-1 px-2"
                            data-testid="assistant-resume-page-next"
                            disabled={resumePageData.page >= resumePageData.totalPages}
                            onClick={() =>
                              setResumePage((page) => Math.min(resumePageData.totalPages, page + 1))
                            }
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Next
                            <ChevronRightIcon className="size-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {!(nativeSessionsLoading && resumeCandidates.length === 0) &&
                  resumeCandidates.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-muted-foreground text-sm">
                      No {agentName} chats match “{debouncedResumeSearch.trim()}”. Try another name.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No {agentName} chats yet — start a New chat, or switch agent to see that agent’s
                history (panel + CLI sessions).
              </p>
            )}
          </div>
        ) : null}

        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              handleCancelDeleteConversation();
            }
          }}
          open={pendingDelete !== null}
        >
          <DialogContent
            className="max-w-sm gap-4 p-5 sm:max-w-sm"
            data-testid="assistant-delete-conversation-dialog"
            overlayStyle={deleteDialogOverlayStyle}
            style={deleteDialogContentStyle}
          >
            <DialogHeader className="space-y-2 pe-6 text-start">
              <DialogTitle className="text-base">Delete this chat forever?</DialogTitle>
              <DialogDescription asChild={true}>
                <div className="space-y-2.5 text-muted-foreground text-sm leading-relaxed">
                  <p>
                    <span className="font-medium text-foreground">
                      “{pendingDelete?.title ?? 'This chat'}”
                    </span>{' '}
                    will be removed from this panel for good. You can’t undo that.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Keep it</span> if you might pick
                    the thread up later. Resume finds your chats by name (and folder path), so old
                    ones are still useful.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Delete</span> only when you’re
                    sure you don’t need it: wrong chat, private notes you don’t want listed, or
                    cleaning up clutter. CLI sessions on your machine are separate and stay
                    available under Resume.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                className="w-full"
                data-testid="assistant-delete-conversation-cancel"
                onClick={handleCancelDeleteConversation}
                type="button"
                variant="outline"
              >
                Keep chat
              </Button>
              <Button
                className="w-full bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 dark:bg-red-600 dark:hover:bg-red-500"
                data-testid="assistant-delete-conversation-confirm"
                onClick={handleConfirmDeleteConversation}
                type="button"
                variant="destructive"
              >
                Delete forever
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  );
};

/** Dev-only draggable sidebar with AI Elements UI and live provider sync. */
export const AssistantChatPanel = (props: AssistantChatPanelProps) => (
  <AssistantChatPanelBody {...props} />
);
