import type { ComponentTone } from "../shared.js";

export interface MeterContract {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  /**
   * Semantic colour of the filled portion. Defaults to `"accent"`.
   * Exists so consumers can express "this meter is complete / at risk"
   * through the public API rather than overriding the fill element's styles.
   */
  tone?: ComponentTone;
}
