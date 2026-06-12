import type { ComponentTone } from "../shared.js";

export type BadgeVariant = "solid" | "outline" | "soft";

export interface BadgeContract {
  variant?: BadgeVariant;
  tone?: ComponentTone;
}
