import type Matter from "matter-js";

/** Component-independent 2-D vector. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type ColorKey = "black" | "red" | "yellow";

export interface Stroke {
  id: string; // uuid-v4
  color: ColorKey;
  pts: Vec2[];
}

export interface Doodle {
  strokes: Stroke[];
}

export interface Level {
  seed: string;
}

/**
 * Shape references returned from PhysicsSystem for rendering.
 */
export interface RenderBody {
  readonly body: Matter.Body;
  readonly color: string;
}
