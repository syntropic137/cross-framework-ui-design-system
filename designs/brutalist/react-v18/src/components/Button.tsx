import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import type { ButtonContract } from "@syntropic137/contracts";
import clsx from "clsx";
import "../styles/button.css";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonContract;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "brutal-btn",
        `brutal-btn--${variant}`,
        `brutal-btn--${size}`,
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    />
  );
});
