/** Brutalist cell: offsets land on a hard grid, never between steps. */
export const STEP_PX = 24;

/**
 * Translation (px) to apply to a decorative parallax layer, snapped to the
 * brutalist step grid.
 *
 * Same signature and same `speed` meaning as the default cell — 0 = pinned,
 * 1 = moves with content — but the result is quantised to STEP_PX so the
 * layer jumps rather than drifts. The design swap must not change the API;
 * it changes the voice.
 *
 * Pure and DOM-free so the maths is testable without a browser.
 */
export function offsetFor(scrollY: number, speed: number): number {
  const clamped = Math.min(1, Math.max(0, speed));
  const continuous = -scrollY * clamped;
  const snapped = Math.round(continuous / STEP_PX) * STEP_PX;
  // Normalise negative zero — see the default cell's offset.ts. Critical
  // here because `-0 % STEP_PX` is `-0`, which breaks the grid assertion.
  return snapped === 0 ? 0 : snapped;
}
