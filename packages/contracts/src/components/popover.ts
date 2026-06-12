import type { OpenContract, PositionContract } from "../shared.js";

export type PopoverRootContract = OpenContract;

export interface PopoverContentContract extends PositionContract {
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}
