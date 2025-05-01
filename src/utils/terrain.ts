/**
 * terrain.ts
 *
 * Intention: Generate deterministic ground polyline based on a seed using a
 * midpoint displacement algorithm constrained by max slope. Also provides a
 * helper to convert the polyline into Matter.js static segment bodies.
 */
import {Vec2} from "@/types/models";
import {PRNG} from "@/utils/seed";
import Matter from "matter-js";

export interface TerrainOpts {
  length: number; // total width in px
  step: number; // horizontal sampling step in px
  maxSlopeDeg: number; // maximum change between adjacent segments in degrees
  maxHeight: number; // height variation in px
}

/** Default terrain parameters matching README spec. */
const DEFAULT_OPTS: TerrainOpts = {
  length: 1600,
  step: 20,
  maxSlopeDeg: 20,
  maxHeight: 200,
};

/** Generate ground polyline (array of Vec2) starting at (0, baseY). */
export function generateTerrain(seed: number, baseY = 500, opts: Partial<TerrainOpts> = {}): Vec2[] {
  const o = {...DEFAULT_OPTS, ...opts};
  const prng = new PRNG(seed);

  const pts: Vec2[] = [{x: 0, y: baseY}];
  const maxSlope = Math.tan((o.maxSlopeDeg * Math.PI) / 180) * o.step;

  for (let x = o.step; x <= o.length; x += o.step) {
    const prevY = pts[pts.length - 1].y;
    // Random displacement within ±maxSlope, bounded by maxHeight
    const delta = (prng.next() * 2 - 1) * maxSlope;
    let y = prevY + delta;
    y = Math.max(baseY - o.maxHeight, Math.min(baseY + o.maxHeight, y));
    pts.push({x, y});
  }
  // Add end segment to bottom of screen for closure
  pts.push({x: o.length, y: baseY + 400});
  pts.push({x: 0, y: baseY + 400});
  return pts;
}

export function terrainToBody(vertices: Vec2[]): Matter.Body {
  return Matter.Bodies.fromVertices(0, 0, [vertices.map((v) => ({x: v.x, y: v.y}))], {
    isStatic: true,
    friction: 0.8,
  }) as Matter.Body;
}
