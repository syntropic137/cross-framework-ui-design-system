import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import type { BadgeContract, ComponentSize } from "@design-system/contracts";
import clsx from "clsx";
import "../design-system/components/badge.css";

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
        "badge",
        `badge--${variant}`,
        `badge--${tone}`,
        `badge--${size}`,
        className
      )}
      {...rest}
    />
  );
});
