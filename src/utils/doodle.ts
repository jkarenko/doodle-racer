/**
 * doodle.ts
 *
 * Utilities to convert user strokes into Matter.js bodies.
 */
import Matter from "matter-js";
import type {Stroke} from "@/types/models";
import {uid} from "@/utils/id";
import {COLORS} from "@/constants";

interface AvatarParts {
  composite: Matter.Composite;
  main: Matter.Body;
  wheels: Matter.Body[];
  legs: Matter.Body[];
}

/** Convert strokes to an avatar composite. Falls back to cube if invalid. */
export function strokesToAvatar(strokes: Stroke[]): AvatarParts {
  const composite = Matter.Composite.create({label: "avatar"});

  const bodyStroke = strokes.find((s) => s.color === "black");
  if (!bodyStroke || bodyStroke.pts.length < 3) {
    const cube = Matter.Bodies.rectangle(0, 0, 60, 60, {label: "body"});
    Matter.Composite.addBody(composite, cube);
    return {composite, main: cube, wheels: [], legs: []};
  }

  // Build body polygon using convex hull of stroke points
  const verts = bodyStroke.pts.map((p) => ({x: p.x, y: p.y}));
  const hull = Matter.Vertices.hull(verts);
  const body = Matter.Bodies.fromVertices(0, 0, [hull], {label: "body"}) as Matter.Body;
  Matter.Composite.addBody(composite, body);

  // Wheels (red strokes) – circle at centroid
  const wheelStrokes = strokes.filter((s) => s.color === "red");
  const wheels: Matter.Body[] = [];
  for (const ws of wheelStrokes) {
    if (ws.pts.length < 3) continue;
    const cx = ws.pts.reduce((sum, p) => sum + p.x, 0) / ws.pts.length;
    const cy = ws.pts.reduce((sum, p) => sum + p.y, 0) / ws.pts.length;
    // radius approximate as max distance
    const r = Math.max(...ws.pts.map((p) => Math.hypot(p.x - cx, p.y - cy)));
    if (r < 5) continue;
    const wheel = Matter.Bodies.circle(cx - body.position.x, cy - body.position.y, r, {
      label: "wheel",
      friction: 0.8,
    });
    // Translate wheel to absolute
    Matter.Body.setPosition(wheel, {x: cx, y: cy});
    Matter.Composite.addBody(composite, wheel);
    wheels.push(wheel);
    // Constraint
    const constraint = Matter.Constraint.create({
      bodyA: body,
      bodyB: wheel,
      length: 0,
      stiffness: 1,
    });
    Matter.Composite.add(constraint);
  }

  // Legs (yellow strokes) – capsule/rectangle with revolute joint to body
  const legs: Matter.Body[] = [];
  const legStrokes = strokes.filter((s) => s.color === "yellow");
  for (const ls of legStrokes) {
    if (ls.pts.length < 2) continue;
    // Use first and last point as endpoints
    const p0 = ls.pts[0];
    const p1 = ls.pts[ls.pts.length - 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const length = Math.hypot(dx, dy);
    if (length < 10) continue;

    // Midpoint for rectangle center
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;

    // Create narrow rectangle to approximate limb (capsule)
    const thickness = 8; // px
    const leg = Matter.Bodies.rectangle(cx, cy, length, thickness, {
      label: "leg",
      friction: 0.8,
    });
    // Rotate to match stroke direction
    Matter.Body.setAngle(leg, Math.atan2(dy, dx));

    Matter.Composite.addBody(composite, leg);
    legs.push(leg);

    // Revolute joint at proximal end (p0)
    const constraint = Matter.Constraint.create({
      bodyA: body,
      pointA: {x: p0.x - body.position.x, y: p0.y - body.position.y},
      bodyB: leg,
      pointB: {x: -length / 2, y: 0},
      length: 0,
      stiffness: 1,
    });
    Matter.Composite.add(composite, constraint);
  }

  return {composite, main: body, wheels, legs};
}
