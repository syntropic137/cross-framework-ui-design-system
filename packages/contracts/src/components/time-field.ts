export interface TimeFieldContract {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  minValue?: string;
  maxValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  hourCycle?: 12 | 24;
}
