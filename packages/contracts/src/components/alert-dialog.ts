import type { OpenContract } from "../shared.js";

export type AlertDialogRootContract = OpenContract;

export interface AlertDialogContentContract {
  closeOnEscape?: boolean;
}
