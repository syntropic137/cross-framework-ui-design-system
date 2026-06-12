export interface CalendarContract {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  minValue?: string;
  maxValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  fixedWeeks?: boolean;
  numberOfMonths?: number;
}
