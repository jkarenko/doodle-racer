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

export class PhysicsSystem implements System {
  private ctx!: GameContext;
  private bodies: RenderBody[] = [];

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

    // Flat ground
    const ground = Bodies.rectangle(400, 600, 1600, 40, {
      isStatic: true,
      restitution: 0.1,
      friction: 0.6,
    });
    Matter.World.add(world, ground);
    this.bodies = [{body: ground, color: COLORS.ground}];

    // Placeholder avatar cube
    const avatar = Bodies.rectangle(200, 200, 60, 60, {
      friction: 0.6,
      restitution: 0.2,
    });
    Matter.World.add(world, avatar);
    this.bodies.push({body: avatar, color: COLORS.body});
  }

  update(): void {
    // No-op; Engine updated by GameFacade
  }

  dispose(): void {
    Matter.World.clear(this.ctx.world, false);
    this.bodies = [];
  }

  public getRenderBodies(): readonly RenderBody[] {
    return this.bodies;
  }
}

export const physicsSystem = new PhysicsSystem();
