import type { RequiredComponentContracts } from "@design-system/contracts";
import { reactV18ContractAdapter } from "@design-system/default-react-v18";
// Swap implementations by changing this one import:
// import { svelteV5ContractAdapter } from "@design-system/default-svelte-v5";
export const ui = reactV18ContractAdapter satisfies Record<
  keyof RequiredComponentContracts,
  unknown
>;
