import {uid} from "@/utils/id";
import type {System} from "@/systems/System";
import type {GameContext} from "@/types/context";
import type {Stroke, ColorKey, Vec2} from "@/types/models";
import {GAME} from "@/constants";
import {log} from "@/utils/logger";

/**
 * InputSystem
 *
 * Intention: Capture pointer interactions and translate them into user strokes
 * that define the doodle. Also manages undo/redo history capped by GAME.undoLimit.
 */
export class InputSystem implements System {
  private ctx!: GameContext;
  private color: ColorKey = "black";
  private currentStroke: Stroke | null = null;
  private strokes: Stroke[] = [];
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];
  private canvas!: HTMLCanvasElement;

  /* ---------- Public API for scenes ---------- */
  public setColor(color: ColorKey): void {
    this.color = color;
  }

  public getStrokes(): readonly Stroke[] {
    return this.strokes;
  }

  public undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(this.strokes);
    this.strokes = this.undoStack.pop()!;
  }

  public redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(this.strokes);
    this.strokes = this.redoStack.pop()!;
  }

  public clear(): void {
    this.pushUndo();
    this.strokes = [];
  }

  /** Replace current strokes with a new set (e.g., loading doodle). */
  public setStrokes(strokes: Stroke[]): void {
    this.pushUndo();
    // Deep copy to prevent shared refs
    this.strokes = strokes.map((s) => ({...s, pts: [...s.pts]}));
  }

  /* ---------- System lifecycle ---------- */
  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.canvas = ctx.canvasFg;

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  update(): void {
    // InputSystem operates event-driven; nothing needed per frame for now.
  }

  dispose(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  /* ---------- Event handlers ---------- */
  private pointerPos = (evt: PointerEvent): Vec2 => {
    const rect = this.canvas.getBoundingClientRect();
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
  };

  private onPointerDown = (evt: PointerEvent): void => {
    if (evt.pointerType === "mouse" && evt.button !== 0) return; // Left button only

    this.canvas.setPointerCapture(evt.pointerId);
    this.currentStroke = {
      id: uid(),
      color: this.color,
      pts: [this.pointerPos(evt)],
    };
    this.strokes.push(this.currentStroke);
  };

  private onPointerMove = (evt: PointerEvent): void => {
    if (!this.currentStroke) return;
    this.currentStroke.pts.push(this.pointerPos(evt));
  };

  private onPointerUp = (evt: PointerEvent): void => {
    if (!this.currentStroke) return;

    if (this.currentStroke.pts.length < 2) {
      // Remove trivial strokes (a click)
      this.strokes.pop();
    }

    this.currentStroke = null;
    this.canvas.releasePointerCapture(evt.pointerId);
    this.pushUndo();
  };

  /* ---------- Helpers ---------- */
  private pushUndo(): void {
    this.undoStack.push([...this.strokes.map((s) => ({...s, pts: [...s.pts]}))]);
    if (this.undoStack.length > GAME.undoLimit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }
}

export const inputSystem = new InputSystem();
