import type { ComponentSize } from "../shared.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonContract {
  variant?: ButtonVariant;
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
  /** @default 'button' */
  type?: "button" | "submit" | "reset";
}
