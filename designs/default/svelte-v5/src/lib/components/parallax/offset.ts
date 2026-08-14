/**
 * Translation (px) to apply to a decorative parallax layer for a given
 * scroll position.
 *
 * `speed` is the fraction of normal scroll motion the layer participates in:
 * 0 = pinned (never moves), 1 = moves exactly like normal page content.
 * The result is negative as `scrollY` grows so a layer inside a
 * fixed-position container drifts upward more slowly than real content.
 *
 * Pure and DOM-free so the maths is testable without a browser.
 */
export function offsetFor(scrollY: number, speed: number): number {
  const clamped = Math.min(1, Math.max(0, speed));
  const offset = -scrollY * clamped;
  // Normalise negative zero. `-scrollY * 0` is IEEE-754 `-0`, which is not
  // `Object.is`-equal to `0` and so leaks into test assertions and any
  // downstream arithmetic (`-0 % n` is `-0`). There is no such thing as a
  // negative amount of no-offset.
  return offset === 0 ? 0 : offset;
}
