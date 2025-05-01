import type Matter from "matter-js";

export interface GameContext {
  readonly canvasBg: HTMLCanvasElement;
  readonly canvasFg: HTMLCanvasElement;
  readonly engine: Matter.Engine;
  readonly world: Matter.World;
  readonly sceneManager?: import("@/scenes/SceneManager").SceneManager;
  readonly settings: Settings;
}

export interface Settings {
  music: boolean;
  sfx: boolean;
  palette: "default" | "colorblind";
}
