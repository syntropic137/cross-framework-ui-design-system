import type { ComponentSize, PositionContract } from "../shared.js";

export interface SelectRootContract {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export interface SelectTriggerContract {
  size?: ComponentSize;
  placeholder?: string;
}

export type SelectContentContract = PositionContract;

export interface SelectItemContract {
  value: string;
  label: string;
  disabled?: boolean;
}
