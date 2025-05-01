/**
 * PhysicsSystem
 *
 * Intention: Wrap matter.js engine/world and convert user strokes into rigid
 * bodies, as well as advance the physics simulation at a fixed time-step. For
 * M2 we start with a simple placeholder avatar and flat ground so that we can
 * test RenderSystem drawing and scene transitions.
 */
import Matter, {Bodies} from "matter-js";
import type {System} from "@/systems/System";
import type {GameContext} from "@/types/context";
import type {RenderBody, Stroke} from "@/types/models";
import {COLORS} from "@/constants";
import {generateTerrain, terrainToBody} from "@/utils/terrain";
import type {Vec2} from "@/types/models";

export class PhysicsSystem implements System {
  private ctx!: GameContext;
  private bodies: RenderBody[] = [];
  private avatar?: Matter.Body;
  private terrainVerts: Vec2[] = [];

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

    // Placeholder avatar cube
    const avatar = Bodies.rectangle(200, 200, 60, 60, {
      friction: 0.6,
      restitution: 0.2,
    });
    Matter.World.add(world, avatar);
    this.bodies.push({body: avatar, color: COLORS.body});
    this.avatar = avatar;
  }

  update(): void {
    // No-op; Engine updated by GameFacade
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
