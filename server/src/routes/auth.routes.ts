import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../middleware/require-auth';

// Slows down password guessing.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' } },
});

export const authRouter = Router()
  .post('/register', credentialsLimiter, auth.register)
  .post('/login', credentialsLimiter, auth.login)
  .post('/logout', auth.logout)
  .get('/me', requireAuth, auth.me);
