import { errorMessage, NoireServiceError } from '@/lib/commerce/errors';

/** Serialisable result returned by every server action so client code never has to catch. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export async function runAction<T>(work: () => Promise<T>, fallback = 'Something went wrong. Please try again.'): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[noire/action]', error);
    }
    if (error instanceof NoireServiceError) {
      return { ok: false, error: error.message, code: error.code };
    }
    const name = (error as { name?: string } | null)?.name;
    if (name === 'UnauthorizedError' || name === 'ForbiddenError') {
      return { ok: false, error: errorMessage(error, fallback), code: 'UNAUTHORIZED' };
    }
    return { ok: false, error: errorMessage(error, fallback) };
  }
}
