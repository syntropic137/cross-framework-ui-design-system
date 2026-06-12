import type { DataOrientation } from "../shared.js";

export interface SeparatorContract {
  /** @default 'horizontal' */
  orientation?: DataOrientation;
  /** When true, hidden from assistive technology */
  decorative?: boolean;
}
