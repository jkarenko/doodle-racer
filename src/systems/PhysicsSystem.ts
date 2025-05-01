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
import type {RenderBody, Stroke} from "@/types/models";
import {COLORS, PHYSICS} from "@/constants";
import {generateTerrain, terrainToBody} from "@/utils/terrain";
import type {Vec2} from "@/types/models";
import {strokesToAvatar} from "@/utils/doodle";

export class PhysicsSystem implements System {
  private ctx!: GameContext;
  private bodies: RenderBody[] = [];
  private avatar?: Matter.Body;
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

    // Convert strokes into avatar composite positioned near start
    const {composite, main, wheels} = strokesToAvatar(strokes);
    this.wheels = wheels;
    Matter.Composite.translate(composite, {x: 200, y: 200});
    Matter.World.addComposite(world, composite);

    this.avatar = main;

    // Collect bodies for rendering
    this.bodies.push({body: main, color: COLORS.body});
    composite.bodies.forEach((b) => {
      if (b === main) return;
      const color = b.label === "wheel" ? COLORS.wheel : COLORS.leg;
      this.bodies.push({body: b, color});
    });
  }

  update(): void {
    // Apply motor torque on wheels to propel the avatar.
    for (const w of this.wheels) {
      // Simple constant torque each frame.
      w.torque += w.mass * PHYSICS.gravity * PHYSICS.wheelTorqueFactor;
    }
  }

  dispose(): void {
    Matter.World.clear(this.ctx.world, false);
    this.bodies = [];
  }

  /** Check if avatar x-position surpassed finishX (default 1400). */
  public hasFinished(finishX = 1400): boolean {
    return this.avatar ? this.avatar.position.x >= finishX : false;
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
}

export const physicsSystem = new PhysicsSystem();
