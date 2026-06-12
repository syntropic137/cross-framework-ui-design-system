import type { OpenContract } from "../shared.js";

export interface AlertDialogRootContract extends OpenContract {}

export interface AlertDialogContentContract {
  closeOnEscape?: boolean;
}
