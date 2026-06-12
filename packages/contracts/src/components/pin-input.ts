export interface PinInputContract {
  value?:          string[];
  onValueChange?:  (value: string[]) => void;
  length?:         number;
  type?:           "text" | "numeric";
  mask?:           boolean;
  placeholder?:    string;
  disabled?:       boolean;
}
