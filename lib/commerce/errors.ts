export type NoireErrorCode = 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'UNAUTHORIZED' | 'INTERNAL_ERROR';

/** Typed error thrown by the service layer; safe to surface `message` to the UI. */
export class NoireServiceError extends Error {
  public readonly code: NoireErrorCode;
  public readonly statusCode: number;

  constructor(message: string, code: NoireErrorCode = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.name = 'NoireServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Translates a PostgREST / Postgres error into a user-safe service error. */
export function toServiceError(error: unknown, fallback = 'The request could not be completed.'): NoireServiceError {
  if (error instanceof NoireServiceError) return error;
  const record = (error ?? {}) as { code?: string; message?: string; details?: string };
  const code = record.code ?? '';
  const message = record.message ?? fallback;
  if (code === '42501' || /insufficient_privilege|permission denied|row-level security/i.test(message)) {
    return new NoireServiceError('You do not have permission to perform this action.', 'UNAUTHORIZED', 403);
  }
  if (code === 'P0002' || code === 'PGRST116') {
    return new NoireServiceError(message || 'Record not found.', 'NOT_FOUND', 404);
  }
  if (code === '22023' || code === 'P0003' || code === '23505' || code === '23514' || code === '23503') {
    return new NoireServiceError(message, 'VALIDATION_ERROR', 422);
  }
  return new NoireServiceError(message || fallback, 'INTERNAL_ERROR', 500);
}

/** `null`-safe message extraction for client code that caught `unknown`. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
