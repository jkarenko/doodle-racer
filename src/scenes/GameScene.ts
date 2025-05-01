/**
 * GameScene
 *
 * Intention: Run physics simulation for the player doodle, display countdown
 * timer, and handle simple victory/defeat transition (placeholder rules for
 * M2). Converts strokes captured from NewGameScene into a physics avatar using
 * PhysicsSystem.reset (currently placeholder cube).
 */
import {SceneId, type SceneModule} from "@/scenes/Scene";
import type {GameContext} from "@/types/context";
import {physicsSystem} from "@/systems/PhysicsSystem";
import {inputSystem} from "@/systems/InputSystem";
import {GAME} from "@/constants";

export class GameScene implements SceneModule {
  private container!: HTMLDivElement;
  private timerEl!: HTMLDivElement;
  private ctx!: GameContext;
  private startTime = 0;
  private rafId = 0;

  mount(root: HTMLElement, ctx: GameContext): void {
    this.ctx = ctx;

    // Reset physics with current strokes (placeholder implementation)
    physicsSystem.reset(inputSystem.getStrokes() as any);

    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      fontFamily: "monospace",
      color: "#000",
    });

    this.timerEl = document.createElement("div");
    Object.assign(this.timerEl.style, {
      position: "absolute",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "24px",
      background: "rgba(255,255,255,0.8)",
      padding: "4px 8px",
      borderRadius: "4px",
    });
    this.container.appendChild(this.timerEl);

    root.appendChild(this.container);

    this.startTime = performance.now();
    this.tick();
  }

  unmount(): void {
    cancelAnimationFrame(this.rafId);
    this.container.remove();
  }

  private tick = (): void => {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const remaining = Math.max(0, GAME.timerSeconds - elapsed);
    this.timerEl.textContent = remaining.toFixed(1);

    if (physicsSystem.hasFinished()) {
      this.finish(true);
      return;
    }

    if (physicsSystem.hasFallen()) {
      this.finish(false);
      return;
    }

    if (remaining <= 0) {
      this.finish(false);
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private finish(victory: boolean): void {
    this.ctx.sceneManager?.change(victory ? SceneId.VICTORY : SceneId.DEFEAT);
  }
}

export const gameScene = (): SceneModule => new GameScene();
