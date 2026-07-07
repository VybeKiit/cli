import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ATTACHMENT_FILE_PREFIX = 'attachment';

// "dir/file.txt" and "dir\\file.txt" -> ["dir", "file.txt"].
const filenameSeparatorPattern = /[/\\]/;
// "bad:name?.png" -> "bad_name_.png".
const unsafeFilenameCharacterPattern = /[^\w.\- ]+/g;

/** One base64 attachment posted by the browser panel. */
export type AttachmentInput = {
  readonly filename?: string;
  readonly mediaType?: string;
  readonly dataBase64?: string;
};

const safeFilename = (name: string, index: number): string => {
  const segments = name.split(filenameSeparatorPattern);
  const lastSegment = segments.at(-1);
  const base = typeof lastSegment === 'string' ? lastSegment : '';
  const cleaned = base.replace(unsafeFilenameCharacterPattern, '_').trim();

  if (cleaned.length > 0) {
    return cleaned;
  }

  return `${ATTACHMENT_FILE_PREFIX}-${index}`;
};

const resolveAttachmentFilename = (attachment: AttachmentInput, index: number): string => {
  if (typeof attachment.filename === 'string') {
    return safeFilename(attachment.filename, index);
  }

  return safeFilename('', index);
};

/**
 * Write base64 attachments to a fresh temp directory.
 *
 * @param attachments - Optional browser-provided attachment payloads.
 * @returns On-disk temp file paths that can be referenced from a CLI prompt.
 * @example
 * const paths = persistAttachments([{ filename: 'notes.txt', dataBase64: 'aGk=' }]);
 */
export const persistAttachments = (
  attachments: readonly AttachmentInput[] | undefined,
): string[] => {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  const dir = mkdtempSync(join(tmpdir(), 'vybe-assistant-chat-'));
  const paths: string[] = [];

  attachments.forEach((attachment, index) => {
    if (!attachment.dataBase64) {
      return;
    }

    const filePath = join(dir, resolveAttachmentFilename(attachment, index));
    writeFileSync(filePath, Buffer.from(attachment.dataBase64, 'base64'));
    paths.push(filePath);
  });

  return paths;
};
