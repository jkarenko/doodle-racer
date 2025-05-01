import {SceneId, type SceneModule} from "@/scenes/Scene";
import type {GameContext} from "@/types/context";
import {log} from "@/utils/logger";

export class SceneManager {
  private readonly root: HTMLElement;
  private readonly ctx: GameContext;
  private currentScene: SceneId | null = null;
  private module: SceneModule | null = null;
  private readonly sceneFactory: Record<SceneId, () => SceneModule>;

  constructor(root: HTMLElement, ctx: GameContext, factory: Record<SceneId, () => SceneModule>) {
    this.root = root;
    this.ctx = ctx;
    this.sceneFactory = factory;
  }

  public get active(): SceneId | null {
    return this.currentScene;
  }

  public change(scene: SceneId): void {
    if (this.currentScene === scene) return;

    // Dispose previous
    this.module?.unmount();
    this.root.innerHTML = "";

    // Create new module lazily
    const creator = this.sceneFactory[scene];
    if (!creator) {
      log("Scene factory missing for", scene);
      return;
    }
    this.module = creator();
    this.module.mount(this.root, this.ctx);
    this.currentScene = scene;
  }
}
