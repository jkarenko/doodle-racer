/**
 * System.ts
 *
 * Intention: Define a minimal contract for plug-and-play subsystems managed by
 * GameFacade. Each System follows a lifecycle of init → update → dispose.
 */
import type {GameContext} from "@/types/context";

export interface System {
  /**
   * One-off initialization. Guaranteed before the first update.
   */
  init(ctx: GameContext): void;

  /**
   * Called each animation frame with elapsed milliseconds.
   */
  update(dt: number, ctx: GameContext): void;

  /**
   * Optional cleanup when the GameFacade disposes the subsystem.
   */
  dispose?(ctx: GameContext): void;
}
