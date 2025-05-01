/**
 * PhysicsSystem
 *
 * Intention: Wrap matter.js engine/world and convert user strokes into rigid
 * bodies, as well as advance the physics simulation at a fixed time-step. For
 * M2 we start with a simple placeholder avatar and flat ground so that we can
 * test RenderSystem drawing and scene transitions.
 */
import Matter from "matter-js";
import type {System} from "@/systems/System";
import type {GameContext} from "@/types/context";
import type {RenderBody, Stroke, Vec2} from "@/types/models";
import {COLORS, PHYSICS, GAME, COLLISION} from "@/constants";
import {generateTerrain, terrainToBody} from "@/utils/terrain";
import {strokesToAvatar} from "@/utils/doodle";

// Type for pairing physics body with its visual stroke
interface VisualPart {
  physics: Matter.Body;
  visual: Stroke;
}

// Updated structure for avatar visual data
interface AvatarVisuals {
  mainBody: Matter.Body;
  visualBodyStroke: Stroke | null;
  wheels: VisualPart[]; // Paired physics wheels and visual strokes
  legs: VisualPart[]; // Paired physics legs and visual strokes
}

export class PhysicsSystem implements System {
  private ctx!: GameContext;
  private bodies: RenderBody[] = [];
  private avatar?: Matter.Body;
  // Store separated visual information
  private avatarVisualBody: Stroke | null = null;
  private avatarVisualWheels: VisualPart[] = [];
  private avatarVisualLegs: VisualPart[] = [];
  private terrainVerts: Vec2[] = [];
  private wheels: Matter.Body[] = [];

  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset([]);
  }

  /**
   * Reset the world, clearing previous bodies and creating new ground + avatar.
   */
  public reset(strokes: Stroke[]): void {
    const {world} = this.ctx;
    Matter.World.clear(world, false);

    // Procedural terrain based on fixed seed for now (will use URL seed later)
    this.terrainVerts = generateTerrain(this.ctx.seed);
    const ground = terrainToBody(this.terrainVerts);
    Matter.World.add(world, ground);
    this.bodies = [{body: ground, color: COLORS.ground}];

    // Clear previous avatar visuals
    this.avatar = undefined;
    this.avatarVisualBody = null;
    this.avatarVisualWheels = [];
    this.avatarVisualLegs = [];
    this.wheels = []; // Clear physics wheel reference too

    // Convert strokes into avatar composite positioned near start
    const avatarParts = strokesToAvatar(strokes);

    // Store references needed for physics/logic
    this.avatar = avatarParts.main;
    this.wheels = avatarParts.wheels;

    // Store structured visual data
    this.avatarVisualBody = avatarParts.visualBodyStroke;
    this.avatarVisualWheels = avatarParts.wheels.map((wheelBody, i) => ({
      physics: wheelBody,
      visual: avatarParts.visualWheelStrokes[i],
    }));
    this.avatarVisualLegs = avatarParts.legs.map((legBody, i) => ({
      physics: legBody,
      visual: avatarParts.visualLegStrokes[i],
    }));

    // Spawn slightly above the starting terrain height (terrainVerts[0].y)
    const startX = 150; // A bit away from the left edge
    // Estimate starting Y based on main body position relative to the first terrain point
    const startY = this.terrainVerts[0].y - (avatarParts.main.bounds.max.y - avatarParts.main.position.y) - 20; // Spawn 20px above ground
    console.log("[PhysicsSystem] Before translate:", {mainPos: avatarParts.main.position, startY: startY});
    Matter.Composite.translate(avatarParts.composite, {
      x: startX - avatarParts.main.position.x,
      y: startY - avatarParts.main.position.y,
    });
    console.log("[PhysicsSystem] After translate:", {mainPos: avatarParts.main.position});
    Matter.World.addComposite(world, avatarParts.composite);

    // Collect ALL bodies from the composite FOR DEBUGGING/OTHER SYSTEMS if needed
    // but NOT primarily for rendering the avatar itself.
    avatarParts.composite.bodies.forEach((b) => {
      let color: string = COLORS.body;
      if (b.label === "wheel") color = COLORS.wheel;
      else if (b.label === "leg") color = COLORS.leg;
      // Avoid duplicates if ground was already added
      if (b.label !== "ground" && !this.bodies.find((rb) => rb.body.id === b.id)) {
        this.bodies.push({body: b, color});
      }
    });
  }

  update(): void {
    // Apply motor torque on wheels to propel the avatar.
    for (const w of this.wheels) {
      // Apply torque only if below target speed, else clamp velocity.
      if (Math.abs(w.angularVelocity) < PHYSICS.wheelMaxAngularVelocity) {
        // Apply torque to reach target speed.
        const torque = w.mass * PHYSICS.gravity * PHYSICS.wheelTorqueFactor;
        // Apply torque in direction opposite to spin if needed (breaking/reverse)
        // For now just constant forward torque
        w.torque += torque;
      } else {
        // Clamp angular velocity to max speed.
        Matter.Body.setAngularVelocity(w, Math.sign(w.angularVelocity) * PHYSICS.wheelMaxAngularVelocity);
        // Optional: Zero torque when at max speed to prevent wind-up?
        w.torque = 0;
      }
    }
  }

  dispose(): void {
    Matter.World.clear(this.ctx.world, false);
    this.bodies = [];
  }

  /** Check if avatar x-position surpassed finishX (default 1400). */
  public hasFinished(): boolean {
    return this.avatar ? this.avatar.position.x >= GAME.finishLineX : false;
  }

  /** Simple defeat: avatar fell below world bounds. */
  public hasFallen(fallY = 800): boolean {
    return this.avatar ? this.avatar.position.y > fallY : false;
  }

  public getRenderBodies(): readonly RenderBody[] {
    return this.bodies;
  }

  public getTerrain(): readonly Vec2[] {
    return this.terrainVerts;
  }

  /** Returns the structured visual data for the avatar. */
  public getAvatarVisuals(): AvatarVisuals | undefined {
    if (!this.avatar) return undefined;
    return {
      mainBody: this.avatar,
      visualBodyStroke: this.avatarVisualBody,
      wheels: this.avatarVisualWheels,
      legs: this.avatarVisualLegs,
    };
  }

  /** Clears the reference to the current avatar body. */
  public clearAvatar(): void {
    this.avatar = undefined;
  }
}

export const physicsSystem = new PhysicsSystem();
