import type { PositionContract } from "../shared.js";

export interface LinkPreviewRootContract {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
}

export type LinkPreviewContentContract = PositionContract;
