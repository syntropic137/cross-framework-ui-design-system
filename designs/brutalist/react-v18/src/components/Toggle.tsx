import { forwardRef, useCallback, useEffect, useState } from "react";
import type {
  ButtonHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent
} from "react";
import type { ToggleContract } from "@syntropic137/contracts";
import clsx from "clsx";
import "../styles/toggle.css";

export type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onChange" | "value"
> &
  ToggleContract;

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    pressed,
    defaultPressed = false,
    onPressedChange,
    disabled,
    className,
    onClick,
    onKeyDown,
    ...rest
  },
  ref
) {
  const isControlled = pressed !== undefined;
  const [internalPressed, setInternalPressed] = useState(defaultPressed);

  useEffect(() => {
    if (!isControlled) {
      setInternalPressed(defaultPressed);
    }
  }, [defaultPressed, isControlled]);

  const currentPressed = isControlled ? pressed! : internalPressed;

  const emitChange = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalPressed(next);
      }
      onPressedChange?.(next);
    },
    [isControlled, onPressedChange]
  );

  const handleToggle = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      emitChange(!currentPressed);
      onClick?.(event);
    },
    [currentPressed, disabled, emitChange, onClick]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        onKeyDown?.(event);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        emitChange(!currentPressed);
      }
      onKeyDown?.(event);
    },
    [currentPressed, disabled, emitChange, onKeyDown]
  );

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-pressed={currentPressed}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      data-state={currentPressed ? "pressed" : "unpressed"}
      className={clsx(
        "brutal-toggle",
        currentPressed && "brutal-toggle--pressed",
        disabled && "brutal-toggle--disabled",
        className
      )}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <span className="brutal-toggle__track" aria-hidden="true">
        <span className="brutal-toggle__thumb" />
      </span>
    </button>
  );
});
