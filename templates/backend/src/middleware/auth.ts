import type { NextFunction, Request, Response } from 'express';
import { resolveAuthProvider } from '@vybekiit/auth';
import { SESSION_COOKIE } from './session.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] ?? req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  const result = await resolveAuthProvider().getUser(token);
  if (!result.ok) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  req.user = result.value;
  next();
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string | null };
    }
  }
}
