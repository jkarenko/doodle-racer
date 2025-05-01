/**
 * constants.ts
 *
 * Intention: Centralized immutable values controlling appearance and physics parameters.
 */

export const COLORS = {
  body: "#000000", // Default black body stroke
  wheel: "#ff0000", // Red wheels
  leg: "#ffff00", // Yellow legs
  ground: "#4caf50", // Ground mesh
  skyStart: "#87ceeb", // Sky gradient start
  skyEnd: "#b9e5ff", // Sky gradient end
} as const;

export const COLORS_COLORBLIND = {
  body: "#000000",
  wheel: "#1e88e5", // blue
  leg: "#ff9800", // orange
  ground: "#4caf50",
  skyStart: "#87ceeb",
  skyEnd: "#b9e5ff",
} as const;

export const PHYSICS = {
  gravity: 9.8, // m/s^2
  slopeFriction: 0.6,
  wheelTorqueFactor: 0.01, // torque = m * g * factor
  stuckVelocityThreshold: 0.4, // m/s
  stuckDuration: 4_000, // ms
  maxWheels: 10,
  maxLegs: 10,
  wheelMaxRpm: 1, // Target rotations per minute
  get wheelMaxAngularVelocity(): number {
    return (this.wheelMaxRpm * 2 * Math.PI) / 60;
  },
} as const;

export const COLLISION = {
  DEFAULT: 0x0001,
  GROUND: 0x0002,
  AVATAR: 0x0004,
  BOUNDARY: 0x0008, // For future walls/level boundaries
} as const;

export const GAME = {
  timerSeconds: 60,
  undoLimit: 50,
  finishLineX: 4000, // World x-coordinate for the finish line
};
