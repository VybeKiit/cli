import { resolveAuthProvider } from '@vybekiit/auth';
import type { Request, Response } from 'express';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '../lib/auth-telemetry.js';
import { SESSION_COOKIE, setSessionCookie, clearSessionCookie } from '../middleware/session.js';

export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!(email && password)) {
      res.status(400).json({ error: 'Enter your email and password.' });
      return;
    }

    const result = await resolveAuthProvider().signUpWithPassword(email, password);
    if (!result.ok) {
      captureAuthRejection(result.error.message, { code: result.error.code, route: 'signup' });
      res.status(400).json({ error: result.error.message });
      return;
    }

    setSessionCookie(res, result.value.id);
    trackAuthEvent('signup_completed', { method: 'password' });
    res.status(201).json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'signup' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function signIn(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!(email && password)) {
      res.status(400).json({ error: 'Enter your email and password.' });
      return;
    }

    const result = await resolveAuthProvider().signInWithPassword(email, password);
    if (!result.ok) {
      captureAuthRejection(result.error.message, { code: result.error.code, route: 'signin' });
      res.status(401).json({ error: result.error.message });
      return;
    }

    setSessionCookie(res, result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'password' });
    res.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'signin' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function signOut(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] ?? '';
  const result = await resolveAuthProvider().getUser(token);
  if (!result.ok) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }
  res.json(result.value);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Enter your email address.' });
      return;
    }
    const result = await resolveAuthProvider().requestPasswordReset(email);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'forgot-password',
      });
      res.status(400).json({ error: result.error.message });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    captureAuthFailure(error, { route: 'forgot-password' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!(token && newPassword)) {
      res.status(400).json({ error: 'Enter your new password.' });
      return;
    }
    const result = await resolveAuthProvider().resetPassword(token, newPassword);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'reset-password',
      });
      res.status(400).json({ error: result.error.message });
      return;
    }
    setSessionCookie(res, result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'password' });
    res.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'reset-password' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function sendMagicLink(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Enter your email address.' });
      return;
    }
    const result = await resolveAuthProvider().sendMagicLink(email);
    if (!result.ok) {
      captureAuthRejection(result.error.message, { code: result.error.code, route: 'magic-link' });
      res.status(400).json({ error: result.error.message });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    captureAuthFailure(error, { route: 'magic-link' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function verifyMagicLink(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ error: 'That sign-in link is not valid.' });
      return;
    }
    const result = await resolveAuthProvider().verifyMagicLink(token);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'magic-link-verify',
      });
      res.status(401).json({ error: result.error.message });
      return;
    }
    setSessionCookie(res, result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'magic_link' });
    res.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'magic-link-verify' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function sendSmsCode(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone) {
      res.status(400).json({ error: 'Enter your phone number.' });
      return;
    }
    const result = await resolveAuthProvider().sendSmsCode(phone);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'send-sms-code',
      });
      res.status(400).json({ error: result.error.message });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    captureAuthFailure(error, { route: 'send-sms-code' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

export async function verifySmsCode(req: Request, res: Response): Promise<void> {
  try {
    const { phone, code } = req.body as { phone?: string; code?: string };
    if (!(phone && code)) {
      res.status(400).json({ error: 'Enter the code we sent you.' });
      return;
    }
    const result = await resolveAuthProvider().verifySmsCode(phone, code);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'verify-sms-code',
      });
      res.status(401).json({ error: result.error.message });
      return;
    }
    setSessionCookie(res, result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'sms' });
    res.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'verify-sms-code' });
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}
