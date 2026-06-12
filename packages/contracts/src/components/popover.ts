import type { OpenContract, PositionContract } from "../shared.js";

export interface PopoverRootContract extends OpenContract {}

export interface PopoverContentContract extends PositionContract {
  closeOnOutsideClick?: boolean;
  closeOnEscape?:       boolean;
}
