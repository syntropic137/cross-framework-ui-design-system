import type { DateRange } from "./date-range-field.js";

export interface RangeCalendarContract {
  value?: DateRange;
  onValueChange?: (value: DateRange) => void;
  defaultValue?: DateRange;
  placeholder?: string;
  minValue?: string;
  maxValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  numberOfMonths?: number;
}
