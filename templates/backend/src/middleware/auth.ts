import { resolveAuthProvider } from '@vybekiit/auth';
import { Effect, Exit } from 'effect';
import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE } from './session.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] ?? req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  const exit = await Effect.runPromiseExit(resolveAuthProvider().getUser(token));
  if (Exit.isFailure(exit)) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  req.user = exit.value;
  next();
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string | null };
    }
  }
}
