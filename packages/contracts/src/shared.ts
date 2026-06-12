export type ComponentSize = "sm" | "md" | "lg";
export type ComponentTone = "neutral" | "success" | "warning" | "danger" | "accent";
export type DataOrientation = "horizontal" | "vertical";
export type DataSide = "top" | "right" | "bottom" | "left";
export type DataAlign = "start" | "center" | "end";
export type CheckedState = boolean | "indeterminate";

/** Shared open/close state for overlay components */
export interface OpenContract {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

/** Shared disabled state */
export interface DisabledContract {
  disabled?: boolean;
}

/** Shared controlled-value pattern */
export interface ValueContract<T = string> {
  value?: T;
  onValueChange?: (value: T) => void;
  defaultValue?: T;
}

/** Shared positioning for floating elements */
export interface PositionContract {
  side?: DataSide;
  align?: DataAlign;
  sideOffset?: number;
  alignOffset?: number;
}
