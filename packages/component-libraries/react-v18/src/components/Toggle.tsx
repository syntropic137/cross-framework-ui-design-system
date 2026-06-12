import { forwardRef, useCallback, useEffect, useState } from "react";
import type {
  ButtonHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent
} from "react";
import clsx from "clsx";
import "../design-system/components/toggle.css";

export type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onChange" | "value"
> & {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Notifies consumers when the checked state toggles. */
  onCheckedChange?: (checked: boolean) => void;
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    checked,
    defaultChecked = false,
    onCheckedChange,
    disabled,
    className,
    onClick,
    onKeyDown,
    ...rest
  },
  ref
) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  useEffect(() => {
    if (!isControlled) {
      setInternalChecked(defaultChecked);
    }
  }, [defaultChecked, isControlled]);

  const currentChecked = isControlled ? checked! : internalChecked;

  const emitChange = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalChecked(next);
      }

      onCheckedChange?.(next);
    },
    [isControlled, onCheckedChange]
  );

  const handleToggle = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      emitChange(!currentChecked);
      onClick?.(event);
    },
    [currentChecked, disabled, emitChange, onClick]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        onKeyDown?.(event);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        emitChange(!currentChecked);
      }

      onKeyDown?.(event);
    },
    [currentChecked, disabled, emitChange, onKeyDown]
  );

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={currentChecked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      data-state={currentChecked ? "checked" : "unchecked"}
      className={clsx(
        "toggle",
        currentChecked && "toggle--checked",
        disabled && "toggle--disabled",
        className
      )}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </button>
  );
});
