import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";
import "../design-system/components/card.css";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx("card", interactive && "card--interactive", className)}
      {...rest}
    />
  );
});
