export interface ProgressContract {
  /** null or undefined means indeterminate */
  value?: number | null;
  max?: number;
}
