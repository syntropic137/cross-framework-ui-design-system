import type { OpenContract, PositionContract } from "../shared.js";

export type MenuRootContract = OpenContract;

export interface MenuContentContract extends PositionContract {
  loop?: boolean;
}

export interface MenuItemContract {
  disabled?: boolean;
  textValue?: string;
}

export interface MenuCheckboxItemContract extends MenuItemContract {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface MenuRadioGroupContract {
  value?: string;
  onValueChange?: (value: string) => void;
}

export type MenuSubContract = OpenContract;
