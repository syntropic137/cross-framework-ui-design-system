import type { ComponentProps } from "svelte";
import type {
  AssertRequiredComponentProps,
  RequiredComponentAdapter,
} from "@design-system/contracts";
import Badge from "./components/badge/Badge.svelte";
import Button from "./components/button/Button.svelte";
import Toggle from "./components/toggle/Toggle.svelte";

export const svelteV5ContractAdapter: RequiredComponentAdapter = {
  badge: Badge,
  button: Button,
  toggle: Toggle,
};

export type SvelteV5AdapterProps = {
  badge: ComponentProps<typeof Badge>;
  button: ComponentProps<typeof Button>;
  toggle: ComponentProps<typeof Toggle>;
};

export type SvelteV5ContractConformance =
  AssertRequiredComponentProps<SvelteV5AdapterProps>;
