/**
 * MainMenuScene
 *
 * Intention: Display the initial menu with options to start a new doodle or
 * enter a seed. Provides keyboard and pointer accessibility via standard DOM.
 */
import {SceneId, type SceneModule} from "@/scenes/Scene";
import type {GameContext} from "@/types/context";
import {log} from "@/utils/logger";

export class MainMenuScene implements SceneModule {
  private container!: HTMLDivElement;
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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "1rem",
      pointerEvents: "auto",
      userSelect: "none",
      fontFamily: "sans-serif",
    });

    const title = document.createElement("h1");
    title.textContent = "Doodle Racer";
    this.container.appendChild(title);

    const newBtn = this.button("New Game", () => this.change(SceneId.NEW_GAME));
    this.container.appendChild(newBtn);

    root.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }

  private change(scene: SceneId): void {
    this.ctx.sceneManager?.change(scene);
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.setAttribute("aria-label", label);
    Object.assign(btn.style, {
      fontSize: "1.25rem",
      padding: "0.5rem 1rem",
      minWidth: "160px",
      cursor: "pointer",
    });
    btn.addEventListener("click", onClick);
    return btn;
  }
}

export const mainMenuScene = (): SceneModule => new MainMenuScene();
