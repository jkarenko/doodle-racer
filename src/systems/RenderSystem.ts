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
import {COLORS, GAME} from "@/constants";
import {physicsSystem} from "@/systems/PhysicsSystem";
import {PRNG} from "@/utils/seed";
import type {Vec2} from "@/types/models";

export class RenderSystem implements System {
  private ctxFg!: CanvasRenderingContext2D;
  private ctxBg!: CanvasRenderingContext2D;
  private dpr = window.devicePixelRatio || 1;
  private width = 0;
  private height = 0;
  private cameraX = 0;
  private clouds: {pos: Vec2; radius: number}[] = [];

  init(ctx: GameContext): void {
    this.ctxFg = ctx.canvasFg.getContext("2d") as CanvasRenderingContext2D;
    this.ctxBg = ctx.canvasBg.getContext("2d") as CanvasRenderingContext2D;
    this.resize(ctx);
    this.generateClouds(ctx.seed);
    window.addEventListener("resize", () => this.resize(ctx));
  }

  update(): void {
    // Camera follow avatar (smooth)
    const avatarBody = (physicsSystem as any).avatar as Matter.Body | undefined;
    if (avatarBody) {
      const target = Math.max(0, avatarBody.position.x - this.width * 0.33);
      this.cameraX += (target - this.cameraX) * 0.1;
    }

    this.clearBg();
    this.drawSky();
    this.drawClouds();
    this.drawTerrain();
    this.drawFinishLine();
    this.clear();
    this.drawStrokes();
    this.drawBodies();
  }

  /** Resets the camera's horizontal position to the start. */
  public resetCamera(): void {
    this.cameraX = 0;
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

    const canvasBg = ctx.canvasBg;
    canvasBg.width = this.width * this.dpr;
    canvasBg.height = this.height * this.dpr;
    canvasBg.style.width = `${this.width}px`;
    canvasBg.style.height = `${this.height}px`;

    // Reset transforms
    this.ctxFg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctxBg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private clear(): void {
    this.ctxFg.setTransform(this.dpr, 0, 0, this.dpr, -this.cameraX * this.dpr, 0);
    this.ctxFg.clearRect(this.cameraX, 0, this.width, this.height);
  }

  private clearBg(): void {
    this.ctxBg.setTransform(this.dpr, 0, 0, this.dpr, -this.cameraX * this.dpr, 0);
    this.ctxBg.clearRect(this.cameraX, 0, this.width, this.height);
  }

  private drawSky(): void {
    const grad = this.ctxBg.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, COLORS.skyStart);
    grad.addColorStop(1, COLORS.skyEnd);
    this.ctxBg.fillStyle = grad;
    this.ctxBg.fillRect(this.cameraX, 0, this.width, this.height);
  }

  private drawClouds(): void {
    const parallax = 0.3;
    this.ctxBg.fillStyle = "rgba(255,255,255,0.8)";
    for (const c of this.clouds) {
      const x = c.pos.x - this.cameraX * parallax;
      const y = c.pos.y;
      this.ctxBg.beginPath();
      this.ctxBg.ellipse(x, y, c.radius, c.radius * 0.6, 0, 0, Math.PI * 2);
      this.ctxBg.fill();
    }
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
      const {body, color} = rb;

      // Skip rendering the ground body outline, as it's filled on the background canvas.
      if (body.label === "ground") {
        continue;
      }

      this.ctxFg.strokeStyle = color;
      this.ctxFg.lineWidth = 2;

      if (body.circleRadius) {
        this.ctxFg.beginPath();
        this.ctxFg.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
        this.ctxFg.stroke();

        if (body.label === "wheel") {
          // Spin accent line
          const angle = body.angle;
          const r = body.circleRadius;
          const endX = body.position.x + Math.cos(angle) * r;
          const endY = body.position.y + Math.sin(angle) * r;
          this.ctxFg.beginPath();
          this.ctxFg.moveTo(body.position.x, body.position.y);
          this.ctxFg.lineTo(endX, endY);
          this.ctxFg.stroke();
        }
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
    if (verts.length < 2) return; // Need at least 2 points for a path

    // Use fillStyle from CSS variable or constant
    this.ctxBg.fillStyle =
      getComputedStyle(document.documentElement).getPropertyValue("--ground-color") || COLORS.ground;

    this.ctxBg.beginPath();
    this.ctxBg.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      this.ctxBg.lineTo(verts[i].x, verts[i].y);
    }
    // Close the path implicitly back to the start? Check if terrain generation includes bottom line.
    // Assuming generateTerrain creates a closed polygon (top surface + vertical sides + bottom)
    this.ctxBg.closePath();
    this.ctxBg.fill();
  }

  private drawFinishLine(): void {
    const finishX = GAME.finishLineX;
    const squareSize = 20;
    const flagWidth = squareSize * 2; // Make the flag 2 squares wide
    const flagHeight = this.height; // Span full canvas height

    for (let y = 0; y < flagHeight; y += squareSize) {
      for (let xOffset = 0; xOffset < flagWidth; xOffset += squareSize) {
        const row = Math.floor(y / squareSize);
        const col = Math.floor(xOffset / squareSize);
        this.ctxBg.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#000000";
        this.ctxBg.fillRect(finishX + xOffset, y, squareSize, squareSize);
      }
    }
  }

  private colorForKey(key: string): string {
    switch (key) {
      case "red":
        return getComputedStyle(document.documentElement).getPropertyValue("--wheel-color") || COLORS.wheel;
      case "yellow":
        return getComputedStyle(document.documentElement).getPropertyValue("--leg-color") || COLORS.leg;
      default:
        return getComputedStyle(document.documentElement).getPropertyValue("--body-color") || COLORS.body;
    }
  }

  private generateClouds(seed: number): void {
    const prng = new PRNG(seed ^ 0xabc123);
    const cloudCount = 12;
    const maxX = 2000; // matches terrain length
    const maxY = this.height * 0.4;
    this.clouds = [];
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        pos: {x: prng.next() * maxX, y: prng.next() * maxY},
        radius: 30 + prng.next() * 40,
      });
    }
  }
}

export const renderSystem = new RenderSystem();
