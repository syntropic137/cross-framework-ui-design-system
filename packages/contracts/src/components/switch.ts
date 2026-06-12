export interface SwitchRootContract {
  checked?:          boolean;
  onCheckedChange?:  (checked: boolean) => void;
  defaultChecked?:   boolean;
  disabled?:         boolean;
  required?:         boolean;
  name?:             string;
  value?:            string;
}
