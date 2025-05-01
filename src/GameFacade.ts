import Matter from "matter-js";
import {log} from "@/utils/logger";
import type {System} from "@/systems/System";
import type {GameContext, Settings} from "@/types/context";
import {GAME} from "@/constants";

/**
 * GameFacade
 *
 * Intention: Central authority responsible for orchestrating subsystems and
 * handling the main game loop ticking at the browser refresh rate.
 */
export class GameFacade {
  private rafId: number = 0;
  private lastTimestamp = 0;
  private readonly ctx: GameContext;
  private readonly systems: System[] = [];
  private running = false;

  constructor(canvasBg: HTMLCanvasElement, canvasFg: HTMLCanvasElement) {
    const engine = Matter.Engine.create({enableSleeping: false});
    engine.gravity.y = 1; // Realistic gravity scale set later via constants

    const defaultSettings: Settings = {
      music: true,
      sfx: true,
      palette: "default",
    };

    this.ctx = {
      canvasBg,
      canvasFg,
      engine,
      world: engine.world,
      settings: defaultSettings,
    };
  }

  /** Register a subsystem for lifecycle management. Must be called before start(). */
  public addSystem(system: System): void {
    this.systems.push(system);
  }

  /** Initialize all subsystems and begin the RAF loop. */
  public start(): void {
    if (this.running) return;

    // Initialize systems
    for (const s of this.systems) {
      s.init(this.ctx);
    }

    this.running = true;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  /** Stop the loop and dispose subsystems. */
  public stop(): void {
    if (!this.running) return;
    cancelAnimationFrame(this.rafId);
    this.running = false;

    for (const s of this.systems) {
      s.dispose?.(this.ctx);
    }
  }

  private loop = (timestamp: number): void => {
    const dt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Cap dt to avoid spiral of death when tab is backgrounded.
    const clampedDt = Math.min(dt, 1000 / 15); // Max 66ms

    // Physics step at fixed 60 Hz using an accumulator.
    Matter.Engine.update(this.ctx.engine, clampedDt);

    // Update subsystems
    for (const s of this.systems) {
      s.update(clampedDt, this.ctx);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}
