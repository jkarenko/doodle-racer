/**
 * id.ts
 *
 * Intention: Generate reasonably unique identifiers for strokes and doodles
 * without pulling heavy dependencies. Uses `crypto.randomUUID` when available
 * and falls back to a timestamp + random string.
 */
export const uid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 32);
};
