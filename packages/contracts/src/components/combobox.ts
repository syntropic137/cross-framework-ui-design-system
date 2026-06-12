import type { PositionContract } from "../shared.js";

export interface ComboboxRootContract {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
}

export type ComboboxContentContract = PositionContract;

export interface ComboboxItemContract {
  value: string;
  label: string;
  disabled?: boolean;
}
