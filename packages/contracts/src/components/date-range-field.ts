export interface DateRange {
  start?: string;
  end?: string;
}

export interface DateRangeFieldContract {
  value?: DateRange;
  onValueChange?: (value: DateRange) => void;
  defaultValue?: DateRange;
  minValue?: string;
  maxValue?: string;
  disabled?: boolean;
  readonly?: boolean;
}
