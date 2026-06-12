import type { OpenContract } from "../shared.js";

export interface DialogRootContract extends OpenContract {}

export interface DialogContentContract {
  closeOnOutsideClick?: boolean;
  closeOnEscape?:       boolean;
}
