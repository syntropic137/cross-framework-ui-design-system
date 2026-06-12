import type { DataOrientation } from "../shared.js";

export interface RadioGroupContract {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  orientation?: DataOrientation;
  name?: string;
}

export interface RadioGroupItemContract {
  value: string;
  disabled?: boolean;
}
