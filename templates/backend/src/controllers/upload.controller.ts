import type { Request, Response } from 'express';

/**
 * Return metadata for an uploaded file.
 *
 * @param req - Express request populated by the upload middleware.
 * @param res - Express response used to send upload metadata or validation errors.
 * @returns Void after writing the JSON response.
 * @example
 * app.post('/upload', uploadSingle, uploadFile);
 */
export const uploadFile = (req: Request, res: Response): void => {
  const { file } = req;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }
  res.status(201).json({
    ok: true,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  });
};
