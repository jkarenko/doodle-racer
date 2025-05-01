/**
 * RenderSystem
 *
 * Intention: Handle all Canvas2D drawing for foreground (avatar strokes & UI)
 * and background (terrain) layers. For now, only implements stroke preview in
 * drawing scene; background & physics bodies will follow in later phases.
 */
import type {System} from "@/systems/System";
import type {GameContext} from "@/types/context";
import {inputSystem} from "@/systems/InputSystem";
import {COLORS} from "@/constants";
import {physicsSystem} from "@/systems/PhysicsSystem";

export class RenderSystem implements System {
  private ctxFg!: CanvasRenderingContext2D;
  private ctxBg!: CanvasRenderingContext2D;
  private dpr = window.devicePixelRatio || 1;
  private width = 0;
  private height = 0;

  init(ctx: GameContext): void {
    this.ctxFg = ctx.canvasFg.getContext("2d") as CanvasRenderingContext2D;
    this.ctxBg = ctx.canvasBg.getContext("2d") as CanvasRenderingContext2D;
    this.resize(ctx);
    window.addEventListener("resize", () => this.resize(ctx));
  }

  update(): void {
    this.clearBg();
    this.drawTerrain();
    this.clear();
    this.drawStrokes();
    this.drawBodies();
  }

  dispose(): void {
    // TODO remove listeners
  }

  private resize(ctx: GameContext): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const canvas = ctx.canvasFg;
    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    this.ctxFg.scale(this.dpr, this.dpr);
  }

  private clear(): void {
    this.ctxFg.clearRect(0, 0, this.width, this.height);
  }

  private clearBg(): void {
    this.ctxBg.clearRect(0, 0, this.width, this.height);
  }

  private drawStrokes(): void {
    const strokes = inputSystem.getStrokes();
    for (const s of strokes) {
      if (s.pts.length < 2) continue;
      this.ctxFg.strokeStyle = this.colorForKey(s.color);
      this.ctxFg.lineWidth = 2;
      this.ctxFg.beginPath();
      this.ctxFg.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) {
        this.ctxFg.lineTo(s.pts[i].x, s.pts[i].y);
      }
      this.ctxFg.stroke();
    }
  }

  private drawBodies(): void {
    const bodies = physicsSystem.getRenderBodies();
    for (const rb of bodies) {
      // Draw rectangle/circle approximation for now
      const {body, color} = rb;
      this.ctxFg.strokeStyle = color;
      this.ctxFg.lineWidth = 2;

      if (body.circleRadius) {
        this.ctxFg.beginPath();
        this.ctxFg.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
        this.ctxFg.stroke();
      } else {
        const verts = body.vertices;
        this.ctxFg.beginPath();
        this.ctxFg.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < verts.length; i++) {
          this.ctxFg.lineTo(verts[i].x, verts[i].y);
        }
        this.ctxFg.closePath();
        this.ctxFg.stroke();
      }
    }
  }

  private drawTerrain(): void {
    const verts = physicsSystem.getTerrain();
    if (verts.length === 0) return;
    this.ctxBg.strokeStyle = COLORS.ground;
    this.ctxBg.lineWidth = 2;
    this.ctxBg.beginPath();
    this.ctxBg.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      this.ctxBg.lineTo(verts[i].x, verts[i].y);
    }
    this.ctxBg.stroke();
  }

  private colorForKey(key: string): string {
    switch (key) {
      case "red":
        return COLORS.wheel;
      case "yellow":
        return COLORS.leg;
      default:
        return COLORS.body;
    }
  }
}

export const renderSystem = new RenderSystem();
