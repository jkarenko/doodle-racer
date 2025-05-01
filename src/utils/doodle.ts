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
  main: Matter.Body; // Invisible physics body (hull)
  wheels: Matter.Body[]; // Invisible physics wheels
  legs: Matter.Body[]; // Invisible physics legs
  // Separate visual strokes
  visualBodyStroke: Stroke | null;
  visualWheelStrokes: Stroke[];
  visualLegStrokes: Stroke[];
}

/** Convert strokes to an avatar composite. Falls back to cube if invalid. */
export function strokesToAvatar(strokes: Stroke[]): AvatarParts {
  // Unique negative group prevents self-collision within this avatar instance.
  const avatarGroup = -Matter.Common.nextId();

  // Common collision filter for all avatar parts.
  const avatarFilter = {
    group: avatarGroup,
    category: COLLISION.AVATAR,
    mask: COLLISION.GROUND | COLLISION.BOUNDARY, // Collide only with ground/boundaries
  };

  const composite = Matter.Composite.create({label: "avatar"});

  const bodyStroke = strokes.find((s) => s.color === "black");
  const wheelStrokes = strokes.filter((s) => s.color === "red");
  const legStrokes = strokes.filter((s) => s.color === "yellow");

  if (!bodyStroke || bodyStroke.pts.length < 3) {
    const cube = Matter.Bodies.rectangle(0, 0, 60, 60, {label: "body"});
    // Keep fallback cube visible, return empty visual strokes
    // Return null/empty arrays for visual strokes
    return {
      composite,
      main: cube,
      wheels: [],
      legs: [],
      visualBodyStroke: null,
      visualWheelStrokes: [],
      visualLegStrokes: [],
    };
  }

  // Build body polygon using convex hull of stroke points
  const verts = bodyStroke.pts.map((p) => ({x: p.x, y: p.y}));
  const hull = Matter.Vertices.hull(verts as Matter.Vertex[]);
  // Matter.Bodies.fromVertices can return an array (for concave shapes) or throw
  // if the vertex set is invalid. Guard against both cases so the game never
  // crashes on malformed user input.
  let body: Matter.Body;
  const bodyOptions = {
    label: "body",
    friction: 0.8,
    collisionFilter: avatarFilter,
    render: {visible: false},
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
      Matter.Composite.add(composite, body);
    } else {
      body = result;
      Matter.Composite.add(composite, body);
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
    Matter.Composite.add(composite, body);
  }

  // Wheels (red strokes) – Use convex hull for physics shape
  const wheels: Matter.Body[] = [];
  const validWheelStrokes: Stroke[] = []; // Store corresponding valid strokes
  for (const ws of wheelStrokes) {
    if (ws.pts.length < 3) continue;

    // Calculate original stroke centroid for constraint positioning
    const strokeCentroidX = ws.pts.reduce((sum, p) => sum + p.x, 0) / ws.pts.length;
    const strokeCentroidY = ws.pts.reduce((sum, p) => sum + p.y, 0) / ws.pts.length;

    // Create physics body from convex hull of the stroke
    const verts = ws.pts.map((p) => ({x: p.x, y: p.y}));
    const hull = Matter.Vertices.hull(verts as Matter.Vertex[]);

    // Check if hull is valid (at least 3 vertices)
    if (hull.length < 3) continue;

    let wheel: Matter.Body;
    const wheelOptions = {
      label: "wheel",
      friction: 0.8, // Keep wheel friction
      collisionFilter: avatarFilter,
      render: {visible: false}, // Keep invisible
    };

    try {
      const hullCentroid = Matter.Vertices.centre(hull);
      // Create body from vertices - use hull centroid as origin
      const result = Matter.Bodies.fromVertices(hullCentroid.x, hullCentroid.y, [hull], wheelOptions);

      if (Array.isArray(result)) {
        // Should generally not happen for a single convex hull, but handle defensively
        wheel = result[0];
        for (const b of result) {
          // Matter.Composite.addBody(composite, b);
          Matter.Composite.add(composite, b);
        }
        // Ensure the main reference is added if it wasn't already the first part
        if (!composite.bodies.includes(wheel)) {
          // Matter.Composite.addBody(composite, wheel);
          Matter.Composite.add(composite, wheel);
        }
      } else {
        wheel = result;
        // Matter.Composite.addBody(composite, wheel);
        Matter.Composite.add(composite, wheel);
      }
    } catch (err) {
      console.error("Failed to create wheel body from vertices:", err);
      continue; // Skip this wheel if creation fails
    }

    // Check if the wheel body was successfully created
    if (!wheel) continue;

    wheels.push(wheel);
    validWheelStrokes.push(ws); // Add the corresponding stroke

    // Constraint: Attach main body (at stroke centroid location) to wheel body (at its hull centroid)
    const constraint = Matter.Constraint.create({
      bodyA: body, // Main avatar body
      // Point A is the *original stroke's centroid* relative to the main body's center
      pointA: {x: strokeCentroidX - body.position.x, y: strokeCentroidY - body.position.y},
      bodyB: wheel, // The new hull-based wheel body
      pointB: {x: 0, y: 0}, // Attach to the center (centroid) of the wheel body
      length: 0,
      stiffness: 0.05,
      damping: 0.05,
    });
    Matter.Composite.add(composite, constraint);
  }

  // Legs (yellow strokes) – capsule/rectangle with revolute joint to body
  const legs: Matter.Body[] = [];
  const validLegStrokes: Stroke[] = []; // Store corresponding valid strokes
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
      friction: 0.9, // Increased grip
      restitution: 0, // No bounce
      collisionFilter: avatarFilter,
      chamfer: {radius: 2}, // Beveled edges to reduce snagging
      // Keep legs visible by default
      render: {visible: false}, // Make legs invisible
    });
    // Rotate to match stroke direction
    Matter.Body.setAngle(leg, Math.atan2(dy, dx));

    Matter.Composite.add(composite, leg);
    // Set leg mass relative to main body mass to keep CoM stable
    Matter.Body.setMass(leg, body.mass * 0.1);
    legs.push(leg);
    validLegStrokes.push(ls); // Add the corresponding stroke

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
    // TODO: Investigate correct way to enable/control constraint motor if needed.
    // Matter.Constraint.motorEnable(constraint); // This function does not exist.
    Matter.Composite.add(composite, constraint);
  }

  // Return physics bodies and separated visual strokes
  return {
    composite,
    main: body,
    wheels,
    legs,
    visualBodyStroke: bodyStroke,
    visualWheelStrokes: validWheelStrokes,
    visualLegStrokes: validLegStrokes,
  };
}
