import type { DataOrientation } from "../shared.js";

export interface TabsRootContract {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  orientation?: DataOrientation;
  loop?: boolean;
}

export interface TabsTriggerContract {
  value: string;
  disabled?: boolean;
}

export interface TabsContentContract {
  value: string;
}
