import { Router } from 'express';
import {
  forgotPassword,
  me,
  resetPassword,
  sendMagicLink,
  sendSmsCode,
  signIn,
  signOut,
  signUp,
  verifyMagicLink,
  verifySmsCode,
} from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', signUp);
authRouter.post('/signin', signIn);
authRouter.post('/signout', signOut);
authRouter.get('/me', me);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/magic-link', sendMagicLink);
authRouter.post('/magic-link/verify', verifyMagicLink);
authRouter.post('/send-sms-code', sendSmsCode);
authRouter.post('/verify-sms-code', verifySmsCode);
