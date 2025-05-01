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

export const PHYSICS = {
  gravity: 9.8, // m/s^2
  slopeFriction: 0.6,
  wheelTorqueFactor: 0.7, // torque = m * g * factor
  stuckVelocityThreshold: 0.4, // m/s
  stuckDuration: 4_000, // ms
  maxWheels: 10,
  maxLegs: 10,
} as const;

export const GAME = {
  timerSeconds: 60,
  undoLimit: 50,
};
