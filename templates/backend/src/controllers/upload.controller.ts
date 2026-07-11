import { Either, Schema } from 'effect';
import type { Request, Response } from 'express';

/**
 * Metadata returned after a successful multipart upload.
 * Validates that multer attached a file with the fields we expose to clients.
 */
const UploadedFileMetaSchema = Schema.Struct({
  filename: Schema.String.pipe(Schema.minLength(1)),
  size: Schema.Number.pipe(Schema.nonNegative()),
  mimetype: Schema.String.pipe(Schema.minLength(1)),
});

const decodeUploadedFileMeta = Schema.decodeUnknownEither(UploadedFileMetaSchema);

/**
 * Return metadata for an uploaded file.
 *
 * Steps:
 * 1. Read `req.file` from multer (absent when the client sent no part).
 * 2. Decode filename/size/mimetype with Effect Schema so the response shape is fixed.
 * 3. Respond 201 with metadata, or 400 when missing/invalid.
 *
 * @param req - Express request populated by the upload middleware.
 * @param res - Express response used to send upload metadata or validation errors.
 * @returns Void after writing the JSON response.
 * @example
 * app.post('/upload', uploadSingle, uploadFile);
 */
export const uploadFile = (req: Request, res: Response): void => {
  const { file } = req;
  if (file === undefined) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  const parsed = decodeUploadedFileMeta({
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  });
  if (Either.isLeft(parsed)) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  res.status(201).json({
    ok: true,
    ...parsed.right,
  });
};
