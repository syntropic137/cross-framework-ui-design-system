import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import type { ButtonContract } from "@design-system/contracts";
import clsx from "clsx";
import "../design-system/components/button.css";

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
      className={clsx("btn", `btn--${variant}`, `btn--${size}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    />
  );
});
