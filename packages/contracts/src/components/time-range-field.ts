export interface TimeRange {
  start?: string;
  end?: string;
}

export interface TimeRangeFieldContract {
  value?: TimeRange;
  onValueChange?: (value: TimeRange) => void;
  defaultValue?: TimeRange;
  minValue?: string;
  maxValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  hourCycle?: 12 | 24;
}
