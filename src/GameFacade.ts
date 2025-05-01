import Matter from "matter-js";
import {log} from "@/utils/logger";
import type {System} from "@/systems/System";
import type {GameContext, Settings} from "@/types/context";
import {SceneManager} from "@/scenes/SceneManager";
import {SceneId, type SceneModule} from "@/scenes/Scene";
import {mainMenuScene} from "@/scenes/MainMenuScene";
import {newGameScene} from "@/scenes/NewGameScene";
import {gameScene} from "@/scenes/GameScene";
import {createOverlayScene} from "@/scenes/OverlayScene";

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
    } as never; // will patch with sceneManager later

    // Create scene root div overlaying canvases
    const sceneRoot = document.createElement("div");
    Object.assign(sceneRoot.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none", // scenes enable as needed
    });
    canvasFg.after(sceneRoot);

    // Scene factory: supply lazily created scene modules (will be populated later)
    const factory: Record<SceneId, () => SceneModule> = {
      [SceneId.MAIN_MENU]: mainMenuScene,
      [SceneId.NEW_GAME]: newGameScene,
      [SceneId.GAME]: gameScene,
      [SceneId.VICTORY]: createOverlayScene("Victory!", "Menu", SceneId.MAIN_MENU),
      [SceneId.DEFEAT]: createOverlayScene("Try Again", "Menu", SceneId.MAIN_MENU),
    };

    const manager = new SceneManager(sceneRoot, this.ctx as any, factory);
    (this.ctx as any).sceneManager = manager;

    // Start with main menu scene
    manager.change(SceneId.MAIN_MENU);
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
