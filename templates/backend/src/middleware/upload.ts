import { join } from 'node:path';
import multer from 'multer';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

/**
 * Parse and validate a single uploaded file.
 *
 * @returns Express middleware that stores one file under `req.file`.
 * @example
 * app.post('/upload', uploadSingle, uploadFile);
 */
export const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error('File type not allowed.'));
      return;
    }
    cb(null, true);
  },
}).single('file');
