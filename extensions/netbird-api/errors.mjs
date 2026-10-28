// Only fixed, sanitised errors may cross the tool boundary.
export class NetBirdError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'NetBirdError';
    this.code = code;
    this.details = details;
  }
}
export function fail(code, message, details) { throw new NetBirdError(code, message, details); }
export function cancelled(signal) {
  if (signal?.aborted) fail('CANCELLED', 'Operação cancelada.');
}
export function publicError(error, dispatched = false) {
  const safe = error instanceof NetBirdError ? error : new NetBirdError('INTERNAL_ERROR', 'Falha interna; detalhes privados não foram divulgados.');
  return {
    status: safe.code === 'CANCELLED' ? 'cancelled' : dispatched ? 'unknown' : 'error',
    code: safe.code, message: safe.message,
    ...(Number.isInteger(safe.details.httpStatus) ? { httpStatus: safe.details.httpStatus } : {}),
    ...(dispatched ? { mutationOutcome: 'not_confirmed', retryAutomatically: false } : {}),
  };
}
