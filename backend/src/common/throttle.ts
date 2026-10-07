/**
 * Per-minute limit for sign-in, registration and password changes.
 * Resolved on every request (not at import time), so the value from .env or
 * the environment applies. CI raises it for browser tests that log in often;
 * production keeps the strict default.
 */
export const authThrottleLimit = () =>
  Number(process.env.AUTH_THROTTLE_LIMIT) || 5;
