/**
 * vec2.ts
 *
 * Intention: Provide minimal immutable vector math utilities so we can avoid
 * pulling in heavy external math libs while keeping code readable. All
 * functions return new objects to avoid accidental shared mutation.
 */
import {Vec2} from "@/types/models";

export const vec2 = (x = 0, y = 0): Vec2 => ({x, y});

export const add = (a: Vec2, b: Vec2): Vec2 => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Vec2, b: Vec2): Vec2 => ({x: a.x - b.x, y: a.y - b.y});
export const scale = (v: Vec2, s: number): Vec2 => ({x: v.x * s, y: v.y * s});
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const lengthSq = (v: Vec2): number => dot(v, v);
export const length = (v: Vec2): number => Math.sqrt(lengthSq(v));
export const normalize = (v: Vec2): Vec2 => {
  const len = length(v);
  return len === 0 ? {x: 0, y: 0} : {x: v.x / len, y: v.y / len};
};
