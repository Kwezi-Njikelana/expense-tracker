import type { CookieOptions, Request, Response } from 'express';
import { loginSchema, registerSchema } from '@expense-tracker/shared';
import { isProduction } from '../config/env';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionToken } from '../lib/auth-token';
import { getUserId } from '../middleware/require-auth';
import * as authService from '../services/auth.service';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

async function startSession(res: Response, userId: string) {
  const token = await signSessionToken(userId);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS * 1000 });
}

export async function register(req: Request, res: Response) {
  const user = await authService.register(registerSchema.parse(req.body));
  await startSession(res, user.id);
  res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const user = await authService.login(loginSchema.parse(req.body));
  await startSession(res, user.id);
  res.json(user);
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  res.json(await authService.getUser(getUserId(req)));
}
