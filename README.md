# Doodle Racer – Design Document (v0.1)

## 1. High‑Level Overview

- **Genre:** Physics‑based side‑scrolling drawing sandbox / racing
- **Elevator pitch:** "Draw it. Roll it. Race it." Players sketch a doodle that springs to life as a self‑propelled all‑terrain vehicle attempting to reach the finish line within 60 s on a procedurally‑generated course.

## 2. Vision & Pillars

1. **Creativity first** – The player’s sketch is the avatar. Simple tools, infinite possibilities.
2. **Emergent physics comedy** – Wobbly legs, over‑spinning wheels, face‑plants: success and failure are equally entertaining.
3. **30‑second loop** – Sketch, test, tweak, repeat. Fast iteration encourages experimentation.
4. **Every device, zero friction** – Runs in any modern mobile or desktop browser; no installs.

## 3. Target Audience & Platforms

- Casual players aged 8‑45 who enjoy sandbox creativity (e.g., Line Rider, Crayon Physics).
- Primary: iPad & Android tablets (touch). Secondary: desktop browsers (mouse/keyboard).

## 4. Gameplay

### Core Loop

1. **Draw** vehicle/creature (body + wheels + legs).
2. **Test** on a seeded track (60 s timer).
3. **Iterate** by tweaking doodle or seed; optionally save/share.

### Success Conditions

- Reach finish line ≤ 60 s → victory overlay + option to save doodle.
- Otherwise: defeat overlay (retry / edit doodle).

### Failure/Edge Cases

- Avatar stuck/overturned for 4 s ⇒ auto‑fail to respect pacing.
- Off‑screen fall ⇒ reset to last ground contact + 2 s penalty.

## 5. Art & Audio Direction

- **Visuals:** Hand‑drawn, single‑stroke lines; flat colors (#000 body, #f00 wheels, #ff0 legs, #4caf50 ground, #87ceeb sky). Minimal UI chrome.
- **Animation:** All line art; no textures. Use tweened opacity for UI fades.
- **Audio:** WebAudio oscillators only. Each material has a waveform:
  - Body drag → low‑pass filtered noise (friction).
  - Wheel spin → sine‑based motor hum.
  - Leg contact → short square click.
  - Music: simple 3‑channel arpeggiated chip‑tune generated from seed.

## 6. Technical Design

### 6.1 Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Language | TypeScript ES2022                                      |
| Render   | HTML5 Canvas 2D API                                    |
| Physics  | Lightweight custom solver (semi‑implicit Euler)        |
| Build    | Vite + esbuild                                         |
| CI       | GitHub Actions (lint, test, bundle‑size < 200 kB gzip) |

### 6.2 Architecture

```
                     +-------------------+
                     |   GameFacade      |
                     +-------------------+
                              |
          +---------+---------+----------+-----------+
          |         |         |          |           |
     +----v---+ +---v---+ +---v---+ +----v---+ +----v----+
     |Input   | |Physics| |Render | |Audio   | |Persistence|
     |System  | |System | |System | |System  | |System     |
     +--------+ +-------+ +-------+ +--------+ +-----------+
```

- **GameFacade:** Scene FSM, global timer, dependency injection.
- **InputSystem:** Pointer events → stroke paths; undo/redo stack.
- **PhysicsSystem:** Rigid bodies (body/wheels/legs) + ground collider; per‑frame integration.
- **RenderSystem:** Two canvas layers (background, foreground); camera scroll.
- **AudioSystem:** Procedural SFX/music tick‑scheduler.
- **PersistenceSystem:** `localStorage` (saved doodles, last seed, settings).

### 6.3 Data Model

```ts
type Stroke = { id: UUID; color: "black"|"red"|"yellow"; pts: Vec2[] };
type RigidBody = { m: number; I: number; verts: Vec2[]; };
interface Doodle {
  body: RigidBody;
  wheels: RigidBody[];
  legs: RigidBody[];
}
interface Level {
  seed: string;
  groundPts: Vec2[];
}
```

### 6.4 Procedural Generation

- **Seed:** 32‑bit string (e.g., `"0x8bd1fca4"`). Stored/replayed in URL hash.
- **Ground:** Midpoint displacement + slope clamp ±20°; resample @ 1 px per world‑unit.
- **Sky:** Gradient + sparse parallax clouds (noise seed).
- **Music:** Seed mod 7 chooses key; pseudo‑random chord progression.

### 6.5 Physics Details

- **Body** = polygon; **wheel** = circle; **leg** = capsule with revolute joint at base.
- No inter‑doodle collision (single player).
- Gravity 9.8 m/s²; time‑step 60 Hz; velocity/position iterations = 8/3.
- Slope friction µ=0.6, wheel torque proportional to mass \* 9.8 \* 0.7.

### 6.6 Performance Targets

- 60 FPS on **iPad (2020)** Safari and **Pixel 7** Chrome.
- Draw ≤ 5 k segments, 3 MB heap after GC.
- Use off‑screen canvas for background & cloud batching.

## 7. UI/UX Specification

### Scene Flow

1. **MainMenu** → (NewGame | EnterSeed)
2. **NewGame** (drawing) → (Done | Clear | Load | MainMenu)
3. **Game** → (Victory | Modify | MainMenu)
4. **Victory** → (SaveDoodle | MainMenu)

### Controls

- Touch/Mouse drag draws; two‑finger pinch to pan (drawing zoom locked 1×).
- Three‑finger tap toggles eraser (accessibility shortcut).
- Buttons min 44 × 44 px; bottom toolbar on mobile, side on desktop.

### Accessibility

- Color‑blind palette toggle (outline style).
- Screen reader labels via `aria‑label` on buttons.
- SFX volume slider; music toggle.

## 8. Audio Implementation

- WebAudio `AudioContext` created on user‑gesture.
- `ScriptProcessorNode` replaced by `AudioWorklet` (Chrome 94+, Safari 15+).
- All oscillator nodes pre‑allocated; gain ramp envelopes to avoid clicks.

## 9. Development Plan

| Milestone | Goal                                 | Duration |
| --------- | ------------------------------------ | -------- |
| M0        | Proof of physics (body + wheel) demo | 1 wk     |
| M1        | Drawing UI & seed terrain            | 2 wk     |
| M2        | Full game loop & victory UI          | 2 wk     |
| M3        | Audio, save/load doodle, polish      | 2 wk     |
| M4        | QA & launch itch.io / PWA            | 1 wk     |

## 10. Risks & Mitigations

| Risk                             | Impact | Mitigation                       |
| -------------------------------- | ------ | -------------------------------- |
| Touch precision on small screens | Medium | Zoom on draw < 600 px width      |
| Physics instability on low FPS   | High   | Fixed timestep; clamp dt         |
| Procedural music fatigue         | Low    | Toggle, multiple seeds           |
| Save data quota                  | Low    | Compress JSON, cap at 20 doodles |

## 11. Glossary

- **Doodle:** Player‑drawn entity (body + appendages).
- **Seed:** String controlling deterministic generation.
- **Viewport:** Canvas visible rect in world units.
- **Body path:** Default black strokes forming root rigid body.

*(End of document)*

