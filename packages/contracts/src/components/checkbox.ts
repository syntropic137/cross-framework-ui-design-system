import type { CheckedState } from "../shared.js";

export interface CheckboxRootContract {
  checked?:          CheckedState;
  onCheckedChange?:  (checked: CheckedState) => void;
  defaultChecked?:   CheckedState;
  disabled?:         boolean;
  required?:         boolean;
  name?:             string;
  value?:            string;
}
