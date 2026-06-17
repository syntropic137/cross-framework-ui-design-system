import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import type { BadgeContract, ComponentSize } from "@syntropic137/contracts";
import clsx from "clsx";
import "../styles/badge.css";

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    BadgeContract {
  size?: ComponentSize;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  { variant = "solid", tone = "neutral", size = "md", className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "brutal-badge",
        `brutal-badge--${variant}`,
        `brutal-badge--${tone}`,
        `brutal-badge--${size}`,
        className
      )}
      {...rest}
    />
  );
});
