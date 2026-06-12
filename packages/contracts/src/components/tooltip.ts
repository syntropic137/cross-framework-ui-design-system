import type { PositionContract } from "../shared.js";

export interface TooltipRootContract {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
}

export type TooltipContentContract = PositionContract;
