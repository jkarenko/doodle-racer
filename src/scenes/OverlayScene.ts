/**
 * OverlayScene factory – returns a SceneModule that shows a centered message
 * with buttons to return to menu or retry.
 */
import {SceneId, type SceneModule} from "@/scenes/Scene";
import type {GameContext} from "@/types/context";

export function createOverlayScene(message: string, primaryLabel: string, primaryTarget: SceneId): () => SceneModule {
  return () => {
    let container: HTMLDivElement;
    let ctx: GameContext;

    const scene: SceneModule = {
      mount(root, c) {
        ctx = c;
        container = document.createElement("div");
        Object.assign(container.style, {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "rgba(0,0,0,0.4)",
          pointerEvents: "auto",
          fontFamily: "sans-serif",
          color: "#fff",
        });

        const msg = document.createElement("h2");
        msg.textContent = message;
        container.appendChild(msg);

        const btn = document.createElement("button");
        btn.textContent = primaryLabel;
        Object.assign(btn.style, {
          fontSize: "1rem",
          padding: "0.5rem 1rem",
          cursor: "pointer",
        });
        btn.addEventListener("click", () => ctx.sceneManager?.change(primaryTarget));
        container.appendChild(btn);

        root.appendChild(container);
      },
      unmount() {
        container.remove();
      },
    };

    return scene;
  };
}
