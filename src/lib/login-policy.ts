// Lockout thresholds (pure, so they can be unit-tested without a database)
export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

export function isLockedOut(failureCount: number) {
  return failureCount >= MAX_FAILURES;
}
