import type {System} from "@/systems/System";
import type {GameContext} from "@/types/context";

/**
 * DebugOverlaySystem (dev-only)
 *
 * Intention: Provide lightweight on-screen diagnostics including FPS and heap
 * usage so we can quickly spot perf regressions during development. The
 * overlay is injected as a transparent, pointer-events-none DOM node to
 * avoid any impact on gameplay interaction.
 */
export class DebugOverlaySystem implements System {
  private overlay!: HTMLDivElement;
  private frameCount = 0;
  private timeAccum = 0; // ms accumulated since last report

  init(_: GameContext): void {
    // Guard: activate only when running in a dev build.
    if (import.meta.env.PROD) {
      return; // In production builds the system stays inert.
    }

    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "absolute",
      top: "4px",
      left: "4px",
      padding: "2px 6px",
      background: "rgba(0,0,0,0.5)",
      color: "#0f0",
      fontFamily: "monospace",
      fontSize: "12px",
      lineHeight: "14px",
      whiteSpace: "pre",
      pointerEvents: "none",
      zIndex: 1000,
    } as CSSStyleDeclaration);

    document.body.appendChild(this.overlay);
  }

  update(dt: number): void {
    if (import.meta.env.PROD) {
      return;
    }

    this.frameCount += 1;
    this.timeAccum += dt;

    if (this.timeAccum >= 500) {
      const fps = (this.frameCount / this.timeAccum) * 1000;
      // If the browser exposes the memory API, show it too.
      // Safari doesn't expose performance.memory, so guard.
      let heapLine = "";
      // @ts-ignore –  The spec is still experimental so TS doesn't know it.
      const mem = (performance as any).memory;
      if (mem && mem.usedJSHeapSize) {
        heapLine = `\nHeap: ${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB`;
      }
      this.overlay.textContent = `FPS: ${fps.toFixed(1)}${heapLine}`;

      // Reset counters
      this.frameCount = 0;
      this.timeAccum = 0;
    }
  }

  dispose(): void {
    if (!import.meta.env.PROD && this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export const debugOverlaySystem = new DebugOverlaySystem();
