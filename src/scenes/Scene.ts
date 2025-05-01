import type {GameContext} from "@/types/context";

export enum SceneId {
  MAIN_MENU = "main_menu",
  NEW_GAME = "new_game",
  GAME = "game",
  VICTORY = "victory",
  DEFEAT = "defeat",
}

export interface SceneModule {
  mount(root: HTMLElement, ctx: GameContext): void;
  unmount(): void;
}
