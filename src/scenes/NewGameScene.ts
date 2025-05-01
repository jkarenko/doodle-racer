/**
 * NewGameScene
 *
 * Intention: Provide drawing UI for the user to sketch their doodle before
 * entering the physics game scene. Integrates with InputSystem to control
 * color selection and history actions.
 */
import {SceneId, type SceneModule} from "@/scenes/Scene";
import type {GameContext} from "@/types/context";
import {inputSystem} from "@/systems/InputSystem";
import {COLORS} from "@/constants";

export class NewGameScene implements SceneModule {
  private container!: HTMLDivElement;
  private toolbar!: HTMLDivElement;
  private ctx!: GameContext;

  mount(root: HTMLElement, ctx: GameContext): void {
    this.ctx = ctx;
    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none", // canvas captures pointer
    });

    // Toolbar bottom center
    this.toolbar = document.createElement("div");
    Object.assign(this.toolbar.style, {
      position: "absolute",
      bottom: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: "0.5rem",
      background: "rgba(255,255,255,0.8)",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      pointerEvents: "auto",
      userSelect: "none",
      fontFamily: "sans-serif",
    });

    this.addColorButton("black", COLORS.body);
    this.addColorButton("red", COLORS.wheel);
    this.addColorButton("yellow", COLORS.leg);

    this.toolbar.appendChild(this.btn("Undo", () => inputSystem.undo()));
    this.toolbar.appendChild(this.btn("Redo", () => inputSystem.redo()));
    this.toolbar.appendChild(this.btn("Clear", () => inputSystem.clear()));
    this.toolbar.appendChild(this.btn("Load", () => this.openLoadDialog()));
    this.toolbar.appendChild(
      this.btn("Done", async () => {
        const name = prompt("Name this doodle?", "My Doodle")?.trim();
        if (name) {
          const {saveDoodle} = await import("@/utils/persistence");
          saveDoodle(name, inputSystem.getStrokes() as any);
        }
        this.change(SceneId.GAME);
      })
    );
    this.toolbar.appendChild(this.btn("Back", () => this.change(SceneId.MAIN_MENU)));

    this.container.appendChild(this.toolbar);
    root.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }

  /* ---------- Helpers ---------- */
  private change(scene: SceneId): void {
    this.ctx.sceneManager?.change(scene);
  }

  private addColorButton(key: "black" | "red" | "yellow", color: string): void {
    const btn = document.createElement("button");
    Object.assign(btn.style, {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      border: "2px solid #333",
      backgroundColor: color,
      cursor: "pointer",
    });
    btn.setAttribute("aria-label", `${key} stroke`);
    btn.addEventListener("click", () => inputSystem.setColor(key));
    this.toolbar.appendChild(btn);
  }

  private openLoadDialog(): void {
    import("@/utils/persistence").then(({loadDoodles}) => {
      const list = loadDoodles();
      if (list.length === 0) {
        alert("No saved doodles");
        return;
      }
      const overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      });

      const dialog = document.createElement("div");
      Object.assign(dialog.style, {
        background: "#fff",
        padding: "1rem",
        borderRadius: "8px",
        maxHeight: "80vh",
        overflowY: "auto",
        minWidth: "240px",
        fontFamily: "sans-serif",
      });
      list.forEach((d) => {
        const item = document.createElement("button");
        item.textContent = d.name;
        Object.assign(item.style, {
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "0.25rem 0.5rem",
          cursor: "pointer",
        });
        item.addEventListener("click", () => {
          inputSystem.setStrokes(d.strokes as any);
          overlay.remove();
        });
        dialog.appendChild(item);
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });

      overlay.appendChild(dialog);
      this.container.appendChild(overlay);
    });
  }

  private btn(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement("button");
    b.textContent = label;
    b.setAttribute("aria-label", label);
    Object.assign(b.style, {
      padding: "0.25rem 0.75rem",
      cursor: "pointer",
    });
    b.addEventListener("click", onClick);
    return b;
  }
}

export const newGameScene = (): SceneModule => new NewGameScene();
