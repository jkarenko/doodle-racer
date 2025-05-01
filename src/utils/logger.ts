/**
 * logger.ts
 *
 * Intention: Provide a centralized, easily replaceable logging shim that can be
 * compiled out or muted for production builds without sprinkling conditionals
 * across the codebase.
 */

const isDev = import.meta.env.DEV;

/* eslint-disable no-console */
export const log = (...args: unknown[]): void => {
  if (isDev) {
    console.log("[LOG]", ...args);
  }
};

export const warn = (...args: unknown[]): void => {
  if (isDev) {
    console.warn("[WARN]", ...args);
  }
};

export const error = (...args: unknown[]): void => {
  if (isDev) {
    console.error("[ERROR]", ...args);
  }
};
/* eslint-enable no-console */
