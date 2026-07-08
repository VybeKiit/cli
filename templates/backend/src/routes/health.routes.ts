import { Router } from 'express';
import { getHealth } from '@/controllers/health.controller.js';

/** Express router that exposes service health checks. */
export const healthRouter = Router();

healthRouter.get('/', getHealth);
