/**
 * Toast: a short message about something that just happened (ARCH 2026-11-10,
 * DreamShip xvzo6.9). Framework-neutral; one toast region per window (F6 reaches it).
 *
 * - `info`: polite status announcement; leaves after `duration` ms, never while
 *   hovered or focused.
 * - `failed`: alert announcement; stays until dismissed or its action is taken.
 * - No motion under `prefers-reduced-motion`.
 * - Never the only record of a failure: the item the toast is about shows its state too.
 */
export type ToastKind = "info" | "failed";

export interface ToastAction {
  /** Visible label of the action button (a real, focusable button). */
  label: string;
  onAction: () => void;
}

export interface ToastContract {
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  /** ms before an `info` toast leaves; ignored for `failed`. @default 6000 */
  duration?: number;
  onDismiss?: () => void;
}
