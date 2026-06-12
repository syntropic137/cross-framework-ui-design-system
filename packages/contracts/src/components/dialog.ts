import type { OpenContract } from "../shared.js";

export type DialogRootContract = OpenContract;

export interface DialogContentContract {
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}
