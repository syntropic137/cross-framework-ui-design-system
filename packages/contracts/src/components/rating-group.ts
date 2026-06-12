export interface RatingGroupContract {
  value?: number;
  onValueChange?: (value: number) => void;
  defaultValue?: number;
  max?: number;
  disabled?: boolean;
  readonly?: boolean;
}
