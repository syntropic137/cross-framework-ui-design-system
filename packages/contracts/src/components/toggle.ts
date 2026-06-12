export interface ToggleContract {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  defaultPressed?: boolean;
  disabled?: boolean;
}
