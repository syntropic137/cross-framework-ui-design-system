import type { DataOrientation } from "../shared.js";

export interface SliderContract {
  value?:          number[];
  onValueChange?:  (value: number[]) => void;
  defaultValue?:   number[];
  min?:            number;
  max?:            number;
  step?:           number;
  disabled?:       boolean;
  orientation?:    DataOrientation;
}
