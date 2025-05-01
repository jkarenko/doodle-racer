/**
 * doodle.ts
 *
 * Utilities to convert user strokes into Matter.js bodies.
 */
import Matter from "matter-js";
import type {Stroke} from "@/types/models";
import {COLLISION} from "@/constants";

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
  // Matter.Bodies.fromVertices can return an array (for concave shapes) or throw
  // if the vertex set is invalid. Guard against both cases so the game never
  // crashes on malformed user input.
  let body: Matter.Body;
  const bodyOptions = {
    label: "body",
    friction: 0.8,
    collisionFilter: {
      category: COLLISION.DEFAULT,
      mask: COLLISION.GROUND | COLLISION.DEFAULT, // Collide with ground and other default objects
    },
  };
  try {
    const centroid = Matter.Vertices.centre(hull);
    const result = Matter.Bodies.fromVertices(centroid.x, centroid.y, [hull], bodyOptions);
    if (Array.isArray(result)) {
      body = result[0];
      // Add each part to the composite so mass/calcs remain correct.
      for (const b of result) {
        // Body parts are already relative to the body centroid, which is body.position
        // No need to add them separately here if body itself is added.
        // Matter.Composite.addBody(composite, b);
      }
      // Ensure the main 'body' reference IS added to the composite
      Matter.Composite.addBody(composite, body);
    } else {
      body = result;
      Matter.Composite.addBody(composite, body);
    }
  } catch (err) {
    // Fallback: simple rectangle around stroke bounds.
    const xs = verts.map((v) => v.x);
    const ys = verts.map((v) => v.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = Math.max(40, maxX - minX);
    const h = Math.max(40, maxY - minY);
    const centroid = {x: (minX + maxX) / 2, y: (minY + maxY) / 2}; // Approx centroid for fallback
    body = Matter.Bodies.rectangle(centroid.x, centroid.y, w, h, bodyOptions);
    Matter.Composite.addBody(composite, body);
  }

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
    // Create wheel at its ABSOLUTE calculated position
    const wheel = Matter.Bodies.circle(cx, cy, r, {
      label: "wheel",
      friction: 0.8,
      collisionFilter: {
        category: COLLISION.DEFAULT,
        mask: COLLISION.GROUND | COLLISION.DEFAULT,
      },
    });
    Matter.Composite.addBody(composite, wheel);
    wheels.push(wheel);
    // Constraint
    const constraint = Matter.Constraint.create({
      bodyA: body,
      // Point A is the wheel's center relative to the body's center
      pointA: {x: cx - body.position.x, y: cy - body.position.y},
      bodyB: wheel,
      pointB: {x: 0, y: 0},
      length: 0,
      stiffness: 0.05,
      damping: 0.05,
    });
    Matter.Composite.add(composite, constraint);
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
    // Create leg at its ABSOLUTE calculated midpoint
    const leg = Matter.Bodies.rectangle(cx, cy, length, thickness, {
      label: "leg",
      friction: 0.8,
      collisionFilter: {
        category: COLLISION.DEFAULT,
        mask: COLLISION.GROUND | COLLISION.DEFAULT,
      },
    });
    // Rotate to match stroke direction
    Matter.Body.setAngle(leg, Math.atan2(dy, dx));

    Matter.Composite.addBody(composite, leg);
    legs.push(leg);

    // Revolute joint at proximal end (p0)
    const constraint = Matter.Constraint.create({
      bodyA: body,
      // Point A is attachment point p0 relative to body center
      pointA: {x: p0.x - body.position.x, y: p0.y - body.position.y},
      bodyB: leg,
      pointB: {x: -length / 2, y: 0},
      length: 0,
      stiffness: 0.05,
      damping: 0.05,
    });
    Matter.Composite.add(composite, constraint);
  }

  return {composite, main: body, wheels, legs};
}
