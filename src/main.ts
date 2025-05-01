import {GameFacade} from "@/GameFacade";
import {log} from "@/utils/logger";
import {inputSystem} from "@/systems/InputSystem";
import {renderSystem} from "@/systems/RenderSystem";
import {physicsSystem} from "@/systems/PhysicsSystem";
import {applyPalette} from "@/utils/theme";
import {debugOverlaySystem} from "@/systems/DebugOverlaySystem";
import Matter from "matter-js";
import * as decomp from "poly-decomp-es";

// Create canvas elements dynamically and append to document body.
const canvasBg = document.createElement("canvas");
const canvasFg = document.createElement("canvas");

canvasBg.id = "bg";
canvasFg.id = "fg";

Object.assign(canvasBg.style, {
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
});
Object.assign(canvasFg.style, {
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
});

// Ensure correct stacking order: bg below fg.
document.body.style.margin = "0";
document.body.appendChild(canvasBg);
document.body.appendChild(canvasFg);

const facade = new GameFacade(canvasBg, canvasFg);

// Register systems
facade.addSystem(inputSystem);
facade.addSystem(renderSystem);
facade.addSystem(physicsSystem);
facade.addSystem(debugOverlaySystem);
// facade.addSystem(new PhysicsSystem());

applyPalette("default");

// Register decomp library for concave polygon support in Matter.js
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – setDecomp is not yet in type definitions.
if ((Matter as any).Common && (Matter as any).Common.setDecomp) {
  (Matter as any).Common.setDecomp(decomp);
}

facade.start();

log("Doodle Racer booted.");
