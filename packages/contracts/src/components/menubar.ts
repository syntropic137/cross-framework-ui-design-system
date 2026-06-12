import type { DataOrientation } from "../shared.js";

export type {
  MenuContentContract as MenubarMenuContentContract,
  MenuItemContract as MenubarItemContract,
  MenuCheckboxItemContract as MenubarCheckboxItemContract,
  MenuRadioGroupContract as MenubarRadioGroupContract,
  MenuSubContract as MenubarSubContract,
} from "./menu.js";

export interface MenubarRootContract {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: DataOrientation;
  loop?: boolean;
}
