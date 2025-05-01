/**
 * seed.ts
 *
 * Intention: Provide utilities for handling 32-bit hexadecimal seeds and a
 * simple deterministic pseudo-random number generator (LCG) for procedural
 * terrain and music generation.
 */

export const DEFAULT_SEED = "0x8bd1fca4";

/** Safely parse a 32-bit hex seed, falling back to default if invalid. */
export function parseSeed(hex: string): number {
  if (/^0x[0-9a-fA-F]{8}$/.test(hex)) {
    return Number.parseInt(hex, 16) >>> 0; // Ensure unsigned 32-bit
  }
  return Number.parseInt(DEFAULT_SEED, 16) >>> 0;
}

/** Linear congruential generator constants (Numerical Recipes). */
const LCG_A = 1664525;
const LCG_C = 1013904223;

export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns float in [0, 1). */
  next(): number {
    this.state = (LCG_A * this.state + LCG_C) >>> 0;
    return this.state / 0xffffffff;
  }

  /** Integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}
