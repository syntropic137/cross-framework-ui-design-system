import type { DataOrientation } from "../shared.js";

export interface NavigationMenuRootContract {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: DataOrientation;
  loop?: boolean;
}

export interface NavigationMenuItemContract {
  value?: string;
}
