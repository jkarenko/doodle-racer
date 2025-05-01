import {GameFacade} from "@/GameFacade";
import {log} from "@/utils/logger";

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

// Placeholder: Add systems here when implemented.
// facade.addSystem(new InputSystem());
// facade.addSystem(new PhysicsSystem());
// facade.addSystem(new RenderSystem());

facade.start();

log("Doodle Racer booted.");
