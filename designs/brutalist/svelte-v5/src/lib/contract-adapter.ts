import type { ComponentProps } from "svelte";
import type {
  AssertRequiredComponentProps,
  RequiredComponentAdapter,
} from "@syntropic137/contracts";
import Badge from "./components/badge/Badge.svelte";
import Button from "./components/button/Button.svelte";
import Toggle from "./components/toggle/Toggle.svelte";

// NOTE: this uses a `: RequiredComponentAdapter` annotation rather than
// `} satisfies RequiredComponentAdapter` (as the React adapter does). With
// `satisfies`, svelte-check's declaration emitter must reference each component's
// `.svelte`-internal `Props` interface in the generated `.d.ts`, which it cannot
// name ("…has or is using name 'Props' but cannot be named") — a Svelte
// declaration-emit limitation, unaffected by renaming the interfaces. The
// annotation widens the entries to `unknown`, so a consumer rendering e.g.
// `svelteV5ContractAdapter.badge` may need a cast. Contract *conformance* is
// still fully enforced at typecheck via SvelteV5ContractConformance below.
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
