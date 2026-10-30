import type { RequestHandler } from 'express';
import { SESSION_COOKIE, verifySessionToken } from '../lib/auth-token';
import { UnauthorizedError } from '../lib/errors';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  const userId = typeof token === 'string' ? await verifySessionToken(token) : null;

  if (!userId) {
    throw new UnauthorizedError();
  }

  req.userId = userId;
  next();
};

/** For handlers mounted behind requireAuth. */
export function getUserId(req: Express.Request) {
  if (!req.userId) throw new UnauthorizedError();
  return req.userId;
}
