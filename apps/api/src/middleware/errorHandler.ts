import { Request, Response, NextFunction } from 'express'

// ── Error codes (mirrored in frontend toastApiError) ──────────────────────────

export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'

// ── Base class ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: ErrorCode = 'INTERNAL_ERROR',
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// ── Typed subclasses — use these in controllers ───────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR')
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT')
  }
}

// ── Global handler — mounted last in index.ts ─────────────────────────────────

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    })
  }

  // Postgres unique violation
  if ((err as any).code === '23505') {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Record already exists' },
    })
  }

  // Postgres FK violation
  if ((err as any).code === '23503') {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Referenced record does not exist' },
    })
  }

  // Postgres check constraint violation
  if ((err as any).code === '23514') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Value not allowed for this field' },
    })
  }

  console.error('[Unhandled error]', err)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
}
