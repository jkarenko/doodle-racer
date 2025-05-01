/**
 * theme.ts
 */
import {COLORS, COLORS_COLORBLIND} from "@/constants";

export type Palette = "default" | "colorblind";

export function applyPalette(p: Palette): void {
  const vars = p === "colorblind" ? COLORS_COLORBLIND : COLORS;
  Object.entries(vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(`--${k}-color`, v);
  });
}
