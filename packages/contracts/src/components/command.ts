export interface CommandRootContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  filter?:         (value: string, search: string) => number;
  loop?:           boolean;
}

export interface CommandInputContract {
  placeholder?:     string;
  value?:           string;
  onValueChange?:   (value: string) => void;
}

export interface CommandItemContract {
  value:      string;
  disabled?:  boolean;
  keywords?:  string[];
}
