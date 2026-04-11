export * from "./run-public-smoke-checks.mjs";
export { main } from "./run-public-smoke-checks.mjs";

import { main } from "./run-public-smoke-checks.mjs";
import { scriptEntryMatches } from "./smoke/shared.mjs";

if (scriptEntryMatches(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error("[smoke] fatal error", error);
    process.exitCode = 1;
  });
}
