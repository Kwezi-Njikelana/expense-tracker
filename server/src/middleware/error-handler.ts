import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@expense-tracker/shared';
import { isProduction } from '../config/env';
import { AppError, NotFoundError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Route ${req.method} ${req.originalUrl.split('?')[0]}`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  };

  if (err instanceof ZodError) {
    status = 400;
    body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  } else if (err instanceof AppError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message } };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    body = { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } };
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    body = { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } };
  }

  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
    if (!isProduction && err instanceof Error) {
      body.error.message = err.message;
    }
  }

  res.status(status).json(body);
};
