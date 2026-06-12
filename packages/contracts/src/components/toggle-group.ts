import type { DataOrientation } from "../shared.js";

export interface ToggleGroupSingleContract {
  type:              "single";
  value?:            string;
  onValueChange?:    (value: string) => void;
  defaultValue?:     string;
  disabled?:         boolean;
  orientation?:      DataOrientation;
}

export interface ToggleGroupMultipleContract {
  type:              "multiple";
  value?:            string[];
  onValueChange?:    (value: string[]) => void;
  defaultValue?:     string[];
  disabled?:         boolean;
  orientation?:      DataOrientation;
}

export type ToggleGroupContract = ToggleGroupSingleContract | ToggleGroupMultipleContract;
