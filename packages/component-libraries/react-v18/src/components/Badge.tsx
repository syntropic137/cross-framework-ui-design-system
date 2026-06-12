import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";
import "../design-system/components/badge.css";

export type BadgeVariant = "primary" | "secondary" | "ghost" | "danger";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  { variant = "primary", size = "md", className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "badge",
        `badge--${variant}`,
        `badge--${size}`,
        className
      )}
      {...rest}
    />
  );
});
