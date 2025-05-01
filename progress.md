# Chat History

> Start implementing the game outlined in @README.md . Use best practices, modularity, use block braces for ifs, whiles, etc, document the intention of the code, not what it does.

## Design Decisions

### Phase 1 – Requirements Analysis

Findings  
A. Explicit functional requirements  
• Drawing UI: users sketch a doodle consisting of body (black strokes), wheels (red), legs (yellow); undo/redo; pinch-to-pan; 3-finger tap eraser.  
• Procedurally generated track seeded by a 32-bit hex string stored in URL hash; option to enter/modify seed.  
• Physics simulation (60 Hz, semi-implicit Euler) for body polygon, wheel circles, leg capsules + joints; gravity 9.8 m/s²; slope friction 0.6; wheel motor torque \(m·g·0.7\).  
• Game loop: 60-s timer to reach finish; stuck ≥ 4 s or off-screen fall ⇒ auto-fail; retry & edit options.  
• Scene flow/menus: MainMenu → NewGame (drawing) → Game → Victory/Defeat overlays with save, modify, main-menu choices.  
• Persistence: save doodles, last seed, settings to localStorage (max 20 doodles, compressed JSON).  
• Audio: procedural SFX (body drag, wheel spin, leg click) and seed-driven chip-tune music via WebAudio/AudioWorklet; volume slider & music toggle.  
• Accessibility: color-blind palette toggle, ARIA labels, controls ≥ 44 px.  
• Performance targets: 60 FPS on iPad 2020/Pixel 7; ≤ 5 k canvas segments, ≤ 3 MB heap; off-screen canvas for background/clouds.  
• Build & CI: TypeScript ES2022, Vite + esbuild; GitHub Actions (lint, test, bundle < 200 kB gzip).

B. Implied requirements  
• Modular ECS-style architecture with GameFacade orchestrating Input, Physics, Render, Audio, Persistence systems.  
• Deterministic replay given same doodle + seed.  
• Touch & mouse parity across browsers (Safari, Chrome, Firefox).  
• Small dependency footprint (custom physics, no heavyweight libs).  
• Security: sandboxed client-side, XSS-safe localStorage handling.  
• Progressive-Web-App capability (manifest, offline support) hinted by launch on itch.io/PWA.

C. Non-functional requirements  
Performance: 60 FPS; bundle < 200 kB gzip; GC-friendly.  
Security: user data isolation; no remote code; CSP headers when hosted.  
Scalability: single-player client-side; focus on device breadth, not server load.  
Maintainability: type-safe, well-documented intentions, modular systems, CI checks.  
Accessibility & UX: as listed above.

Current confidence: 60 %

Questions / ambiguities to resolve  
1. Scope of first implementation: do we target Milestone 0 (physics demo) or attempt full feature set immediately?  
2. Audio: include in first build or postpone to later milestone?  
3. Persistence: is localStorage sufficient or will sharing doodles via URL/remote backend be required now?  
4. Accessibility items (color-blind palette, ARIA) — mandatory in first cut or allowed in later polish phase?  
5. CI/GitHub Actions — should we set up from day one or after initial prototype?  
6. Art assets: will everything be procedurally drawn (no external images), or do we need any placeholder assets?  
7. Target browsers: must we support Firefox at launch?  
8. Any preference for state-management style (OOP classes vs functional modules) beyond “modular TypeScript”?

Next steps  
• Await clarification on questions above.  
• Upon answers, proceed to Phase 2 – System Context Examination, inspecting/creating initial repo structure and identifying integration points.

> 1. M2
> 2. postpone
> 3. local
> 4. mandatory
> 5. later
> 6. Everything is procedurally drawn
> 7. Firefox, Chrome, Safari
> 8. What ever makes the most sense

### Phase 2 – System Context Examination

Findings  
A. Existing codebase  
• Only a README is present ⇒ we will create the full structure from scratch. No legacy constraints.  
• Build system, assets, CI, etc. will be added later (Milestone > M2).

B. External systems & boundaries  
• Browser runtime (Chrome, Safari, Firefox) with Canvas 2D, Pointer Events, and localStorage.  
• No server-side components; deterministic URL hash will enable sharing even without backend.  
• Accessibility APIs (ARIA) for overlays/menus.  
• Optional: Web Share API for later milestones (not needed now).  
System context diagram (textual):

```
+------------------------ Browser Tab -------------------------+
|                                                              |
|  HTML UI Layer (DOM)    <----->  GameFacade (TypeScript)     |
|        |                                |                    |
|   Accessibility (ARIA)        +---------v---------+          |
|        |                      |  Game Core ECS    |          |
|        |                      +----+----+----+----+          |
|        v                           |    |    |               |
|  Canvas Overlays             Input | Physics | Render        |
|        |                           |    |    |               |
|        v                           v    v    v               |
|  <canvas#bg>  <canvas#fg> <localStorage> <window.history>    |
|                                                              |
+--------------------------------------------------------------+
```

C. Integration points  
• Pointer/Touch events captured by InputSystem → stroke data → GameFacade.  
• GameFacade converts strokes to Doodle model and passes to PhysicsSystem.  
• PhysicsSystem updates world state each tick; RenderSystem draws to canvases.  
• UI scenes (MainMenu, NewGame, Game, Victory/Defeat) interact with GameFacade for state changes; they live in DOM for ease of accessibility.  
• LocalStorage adapter accessed only via PersistenceSystem façade.  
• URL hash manager provides seed.

D. Responsibilities  
• GameFacade: finite-state machine, ticks subsystems, resolves scene transitions.  
• Systems are independent modules importing shared math/utils.  
• Scene UI: plain TypeScript templating (no heavy framework) to minimize bundle size.

Current confidence: 75 %

Questions to resolve  
1. Menu/overlay look-and-feel: are plain DOM elements styled with CSS acceptable, or must we keep everything on canvas? (DOM recommended for a11y)  
2. For physics we’ll author a minimal custom engine. Are we allowed to use tiny helper libs for vector math (e.g., gl-matrix) or must we write all ourselves to control bundle size?  
3. Any preference for module format? (ES modules in Vite build assumed)  

Next steps  
• If answers are “DOM is fine” and “tiny math lib acceptable”, proceed.  
• Move to Phase 3 – Architecture Design: propose candidate patterns and select the optimal, outline core modules/interfaces, database schema (localStorage keys), and cross-cutting concerns.

> 1. DOM
> 2. use matter.js for all physics
> 3. no special preferences, just make it good and professional

### Phase 3 – Architecture Design

1. Candidate architecture patterns  
A. Modular “Subsystem-Facade” Pattern  
   • GameFacade finite-state machine orchestrates discrete subsystems (Input, Physics, Render, UI, Persistence, Audio*).  
   • Each subsystem is a cohesive ES-module exposing an init(), update(dt), and dispose() contract.  
   • Clear, shallow dependency graph (only GameFacade imports subsystems).  
   • Small cognitive load, minimal runtime overhead, easy tree-shaking ⇒ helps keep bundle < 200 kB.  
   • Fits M2 scope without premature complexity; scales to later milestones.

B. Full ECS (Entity-Component-System)  
   • Generic entities & data-driven components; systems iterate over component pools.  
   • Promotes extreme decoupling and code reuse.  
   • Drawbacks: larger code footprint, steeper learning curve, unnecessary abstraction for a single-avatar game.  
   • Would duplicate some of matter.js functionality (bodies/constraints) and risk bundle bloat.

C. MVU/Redux-style Global State Store  
   • Single immutable state tree; pure reducers mutate state; views subscribe to slices.  
   • Great for testability and undo/redo, but fine-grained Canvas drawing & physics step still need imperative loops.  
   • Adds boilerplate; reducers would mostly forward to matter.js and Canvas imperative code.

2. Recommendation  
Choose Pattern A – Modular Subsystem-Facade.  
Rationale: meets all current requirements with lowest complexity and bundle size; keeps physics/render loops imperative (better performance) while isolating concerns for maintainability and testability.

3. Core components & responsibilities  

• GameFacade (singleton)  
  ‑ Holds current Scene enum (MAIN_MENU | NEW_GAME | GAME | VICTORY | DEFEAT).  
  ‑ Controls main loop (requestAnimationFrame), passes deltaTime to subsystems.  
  ‑ Provides dependency injection (reference to matter.js world, Canvas contexts, DOM roots).  

• SceneManager  
  ‑ Lightweight router that swaps DOM scene modules based on GameFacade state.

• InputSystem  
  ‑ PointerEvents → stroke capture (Vec2[]).  
  ‑ Keeps undo/redo stacks; exposes current strokes to RenderSystem.

• PhysicsSystem (matter.js wrapper)  
  ‑ Converts finalized stroke data into rigid bodies (polygon body, circular wheels, capsule legs).  
  ‑ Manages world, integrates at 60 Hz; publishes avatar transform & ground mesh for rendering.  
  ‑ Exposes helper for “isAvatarStuck” (≥4 s low velocity) and off-screen detection.

• RenderSystem  
  ‑ Two <canvas> layers (bg, fg).  
  ‑ Bg: off-screen generation of seed terrain & clouds, then drawn each frame; implements camera scroll.  
  ‑ Fg: avatar strokes, UI overlays if canvas-based (timer, ghost path).  
  ‑ Uses devicePixelRatio scaling for crispness.

• PersistenceSystem  
  ‑ localStorage CRUD for doodles (compressed with LZ-string), lastSeed, settings.  
  ‑ Enforces 20-doodle cap.

• AudioSystem* (stub during M2)  
  ‑ Placeholder public API (playSfx(type), startMusic(seed), stopMusic()) to avoid future refactor.

• Utilities  
  ‑ math/Vec2.ts (tiny vector functions or re-export from matter-vector)  
  ‑ seed.ts (PRNG & terrain generation)  
  ‑ constants.ts (colors, physics params)

4. Interfaces & contracts (abbreviated)  

```ts
// ecs.ts
export interface System {
  init(ctx: GameContext): void;
  update(dt: number, ctx: GameContext): void;
  dispose?(ctx: GameContext): void;
}

// models.ts
export type Stroke = { id: string; color: ColorKey; pts: Vec2[] };
export interface Doodle { strokes: Stroke[]; }

// persistence.ts
export interface PersistenceAPI {
  loadDoodles(): Promise<DoodleMeta[]>;
  saveDoodle(d: DoodleMeta): Promise<void>;
}
```

5. localStorage schema  

Key                    | Value
---------------------- | ------------------------------
`dr:doodles`           | JSON string ‑ compressed array of DoodleMeta
`dr:lastSeed`          | `"0x8bd1fca4"`
`dr:settings`          | JSON `{ music:true, sfx:true, palette:'default' }`

6. Cross-cutting concerns  

• Accessibility:  
  ‑ All DOM buttons/divs receive role and aria-label; keyboard focus order mirrors visual order.  
  ‑ Color-blind palette toggle updates CSS variables (`--body-color`, `--wheel-color`, …).  

• Error handling & logging:  
  ‑ Central logger util wraps `console` with development flag.  
  ‑ Global `window.onerror` → user-friendly overlay (non-blocking in prod, full stack in dev).  

• Security:  
  ‑ Strict Content-Security-Policy in future hosting; escape user-generated JSON before injecting (unlikely XSS, but safe).  

• Performance:  
  ‑ Matter.js runs in single world; broadphase only collides avatar vs ground.  
  ‑ `requestAnimationFrame` throttled when tab hidden.  
  ‑ Reuse Canvas paths; off-screen canvas for BG; pool arrays to limit GC.  

Current understanding confidence: 85 %

Questions / remaining ambiguities  
1. Stroke-to-body conversion: wheels and legs are color-based; is the rule “first stroke per color becomes that part” or multiple wheels/legs allowed?  
2. Undo/redo: depth cap or unlimited until memory? (recommend configurable cap, e.g., 50 actions).  
3. Victory/defeat overlays: render on DOM (simpler a11y) or inside Canvas (matches art style)?  

Next steps  
• Await answers above → move to Phase 4 (Technical Specification) detailing tech choices, phase breakdown, API contracts, success criteria.

> 1. Multiple wheels/legs allowed
> 2. cap to 50
> 3. Canvas

### Phase 4 – Technical Specification

1. Recommended Technologies & Justification  
• TypeScript ES2022 + native ES-modules — static safety, tree-shaking, modern syntax.  
• Vite + esbuild — ultra-fast dev server, zero-config production bundling; easy splitter to stay < 200 kB gzip.  
• Matter.js (≈ 50 kB min+gzip) — mature 2-D physics with polygons, circles, constraints; avoids bespoke solver.  
• Canvas 2D API — broad browser support, performant for vector strokes.  
• Pointer Events — single spec for mouse/touch/pen across Chrome, Safari, Firefox.  
• LZ-string (≈ 3 kB) — simple compression for localStorage doodles.  
• ESLint + Prettier — style & quality gate; run via `npm run lint`.  
• Vitest — light-weight unit tests for helpers (seed RNG, math, stroke parsing).  
• TSDoc — intention-focused inline comments.  
• CSS variables + BEM naming — theming (color-blind palette) with minimal bundle cost.

2. Implementation Road-map (M2 scope)  

| Phase | Deliverable | Depends on |
|------|-------------|------------|
| A | Repo bootstrap (Vite, TS, ESLint, Prettier, Vitest) | — |
| B | Core shared modules (`Vec2`, `constants`, `utils/logger`) | A |
| C | SceneManager + bare DOM scenes (MainMenu, NewGame, Game, Victory, Defeat) | B |
| D | InputSystem (stroke capture, undo/redo 50-cap, pinch-pan) with unit tests | B |
| E | Terrain generator (seed, midpoint displacement) + bg canvas renderer | B |
| F | RenderSystem (fg canvas, avatar strokes, camera scroll, timer, overlay UI) | C D E |
| G | PhysicsSystem wrapper around Matter.js: stroke→bodies conversion, world step, stuck/off-screen detection | C D |
| H | GameFacade main loop (requestAnimationFrame), 60 s timer, scene transitions | C–G |
| I | PersistenceSystem (localStorage CRUD, compression) | B |
| J | Accessibility: ARIA labels on DOM scenes, color-blind palette toggle via CSS vars | C |
| K | Polishing pass: performance profiling, bundle size check, responsive layout | F H |

3. Technical Risks & Mitigations  

Risk | Mitigation
-----|-----------
Matter.js bundle weight pushes over 200 kB | Enable Vite rollup treeshake; import named modules only; gzip target includes entire bundle margin.  
Pointer Events inconsistencies (Safari older versions) | Polyfill pointer-events only for affected browsers; limited surface area to InputSystem.  
Canvas overlay text readability on high-dpi | Use `ctx.scale(devicePixelRatio, devicePixelRatio)`; test on iPad/Pixel.  
Stroke→rigid-body triangulation for complex polygons can fail | Restrict body stroke to <= 64 vertices; run ear- clipping fallback; warn user visually.  
Undo/redo memory growth | Array pool reuse; cap 50; drop oldest snapshots.  
LocalStorage quota exceeded | 20-doodle hard limit, plus LZ-string compression; surface “storage full” toast.  
Bundle drift over milestones | GitHub Action size-budget job (added post-M2).  

4. Detailed Component Specifications  

4.1 GameContext  

```ts
export interface GameContext {
  readonly canvasBg: HTMLCanvasElement;
  readonly canvasFg: HTMLCanvasElement;
  readonly engine: Matter.Engine;
  readonly world: Matter.World;
  readonly scene: SceneManager;
  settings: Settings;          // reactive object
}
```

4.2 System Contract  

```ts
export interface System {
  init(ctx: GameContext): void;
  update(dt: number, ctx: GameContext): void;
  dispose?(ctx: GameContext): void;
}
```

4.3 InputSystem  

• State: `currentStroke: Stroke | null`, `strokes: Stroke[]`, `undoStack: Stroke[][] (<=50)`, `redoStack: Stroke[][]`.  
• API:  
  – `getStrokes(): readonly Stroke[]` — for Render/Physics.  
  – `undo(), redo(), clear()` — invoked by UI buttons.  
• Validation: ensure each stroke `pts.length ≥ 2`; reject if exceeding 1 k pts (perf guard).  
• Events: emits `strokeFinalized(stroke: Stroke)` when pointer up.

4.4 PhysicsSystem  

• `init`: create Matter.Engine (fixed timestep 1/60), register collision categories.  
• Conversion rules:  
  – Black strokes → one compound polygon body (auto-triangulated).  
  – Red strokes → each closed path within 10-200 px diameter becomes wheel (circle body + revolute joint to body CM).  
  – Yellow strokes → each stroke 10-120 px length becomes capsule leg (rectangle + two circle ends) jointed at proximal end.  
• API:  
  – `avatarIsStuck(): boolean` — velocity < 0.4 m/s for 4 s.  
  – `avatarOffscreen(viewport: Rect): boolean`.  

4.5 RenderSystem  

• Bg canvas draws: terrain polyline (green), sky gradient, clouds (white α). Cached to off-screen canvas sized to 3× viewport width; scrolled by camera x.  
• Fg canvas draws per frame:  
  – Body, wheels, legs from Matter bodies (with stroke styles).  
  – Wheel rotation accent line for visual spin.  
  – Overlay: 60 s countdown digits (Canvas text API, font monospace 24 px).  
  – Defeat/Victory overlays drawn with semi-transparent rect + centered text.  
• DevicePixelRatio scaling; requestAnimationFrame loop triggered from GameFacade.

4.6 PersistenceSystem  

```ts
export const loadDoodles = (): Promise<DoodleMeta[]> => ...
export const saveDoodle = (d: DoodleMeta): Promise<void> => ...
```

• Data schema:

```ts
interface DoodleMeta {
  id: string;             // uuid-v4
  name: string;
  created: number;        // epoch ms
  doodle: Doodle;         // full stroke data
}
```

4.7 SceneManager  

```ts
export enum Scene { MAIN_MENU, NEW_GAME, GAME, VICTORY, DEFEAT }

export type SceneModule = {
  mount(root: HTMLElement, ctx: GameContext): void;
  unmount(): void;
};
```

Switching a scene disposes the previous module, mounts next.

4.8 Validation Rules  

• Seed: regex `/^0x[0-9a-fA-F]{8}$/`.  
• Stroke color: must match keys `"black" | "red" | "yellow"`.  
• Wheels/legs limit: sum ≤ 10 each to prevent extreme physics.  
• Name field (`Save Doodle`) length ≤ 30 chars, sanitized (strip `<>&"`).

5. Technical Success Criteria  

✓ Game runs at 60 FPS on iPad 2020 Safari & Pixel 7 Chrome with doodle of 5 k segments.  
✓ Reach finish line switches to Victory overlay; stuck/off-screen triggers Defeat overlay within spec timings.  
✓ Drawing UI supports undo/redo (50), pinch-pan, color select; behaves identically mouse/touch.  
✓ Multiple wheels/legs render and simulate correctly.  
✓ Color-blind palette toggle changes rendered colors without reload.  
✓ localStorage persists doodles, lastSeed, settings; max-20 enforced; compressed.  
✓ Bundle size (dist/assets + JS) < 200 kB gzip.  
✓ ESLint passes; `npm test` (Vitest) > 80% coverage for utility modules.  
✓ All interactive elements keyboard-focusable with ARIA labels; manual audit passes with Lighthouse a11y score ≥ 90.

Current confidence: 92 %

I’m ready to build! Switch to Agent mode and tell me to continue.

## Implementation
