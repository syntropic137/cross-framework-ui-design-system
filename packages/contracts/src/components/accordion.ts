import type { DataOrientation } from "../shared.js";

export interface AccordionSingleContract {
  type: "single";
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  orientation?: DataOrientation;
}

export interface AccordionMultipleContract {
  type: "multiple";
  value?: string[];
  onValueChange?: (value: string[]) => void;
  defaultValue?: string[];
  disabled?: boolean;
  orientation?: DataOrientation;
}

export type AccordionContract = AccordionSingleContract | AccordionMultipleContract;

export interface AccordionItemContract {
  value: string;
  disabled?: boolean;
}
