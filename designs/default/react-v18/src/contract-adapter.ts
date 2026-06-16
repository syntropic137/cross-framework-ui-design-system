import type { ComponentProps } from "react";
import type {
  AssertRequiredComponentProps,
  RequiredComponentAdapter,
} from "@design-system/contracts";
import { Badge } from "./components/Badge.js";
import { Button } from "./components/Button.js";
import { Toggle } from "./components/Toggle.js";

export const reactV18ContractAdapter = {
  badge: Badge,
  button: Button,
  toggle: Toggle,
} satisfies RequiredComponentAdapter;

export type ReactV18AdapterProps = {
  badge: ComponentProps<typeof Badge>;
  button: ComponentProps<typeof Button>;
  toggle: ComponentProps<typeof Toggle>;
};

export type ReactV18ContractConformance =
  AssertRequiredComponentProps<ReactV18AdapterProps>;
