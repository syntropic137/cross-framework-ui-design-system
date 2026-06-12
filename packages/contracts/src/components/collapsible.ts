import type { OpenContract } from "../shared.js";

export interface CollapsibleRootContract extends OpenContract {
  disabled?: boolean;
}
