#!/usr/bin/env node
// In-repo entry point for the design-system:verify gate.
//
// The gate itself ships with @syntropic137/design-contracts as the
// `design-system-verify` bin (packages/contracts/bin/verify-design-system.mjs),
// so consumer repos run the same checks. This wrapper runs it against this
// repo's root, whatever the current directory, and re-exports its helpers for
// scripts/verify-design-system.test.mjs.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../packages/contracts/bin/verify-design-system.mjs';

export {
  discoverDesignPackages,
  isDecorativeFile,
  parseArgs,
  scanCssForHardcodedColors,
} from '../packages/contracts/bin/verify-design-system.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

if (import.meta.url === `file://${process.argv[1]}`) {
  main(['--root', ROOT, ...process.argv.slice(2)]);
}
