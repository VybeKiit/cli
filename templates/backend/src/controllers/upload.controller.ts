import type { Request, Response } from 'express';

export function uploadFile(req: Request, res: Response): void {
  const file = req.file;
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
}
