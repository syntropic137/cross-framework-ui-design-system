import type { DataOrientation } from "../shared.js";

export interface ToolbarContract {
  orientation?: DataOrientation;
  loop?: boolean;
}
