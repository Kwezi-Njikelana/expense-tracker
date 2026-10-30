import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './auth.routes';
import { categoryRouter } from './category.routes';
import { expenseRouter } from './expense.routes';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } },
});

export const apiRouter = Router()
  .use(apiLimiter)
  .use('/auth', authRouter)
  .use('/categories', categoryRouter)
  .use('/expenses', expenseRouter);
