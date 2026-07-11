import { join } from 'node:path';
import { Either, Schema } from 'effect';
import multer from 'multer';

/** MIME types the upload route accepts (images + PDF). */
const AllowedUploadMimeTypeSchema = Schema.Literal(
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
);

const decodeAllowedMimeType = Schema.decodeUnknownEither(AllowedUploadMimeTypeSchema);

const storage = multer.diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

/**
 * Parse and validate a single uploaded file.
 *
 * Multer still owns multipart parsing; MIME allowlisting uses Effect Schema so the
 * accepted types stay a single readable struct (same style as JSON route bodies).
 *
 * @returns Express middleware that stores one file under `req.file`.
 * @example
 * app.post('/upload', uploadSingle, uploadFile);
 */
export const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const parsed = decodeAllowedMimeType(file.mimetype);
    if (Either.isLeft(parsed)) {
      cb(new Error('File type not allowed.'));
      return;
    }
    cb(null, true);
  },
}).single('file');
