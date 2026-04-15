export * from "./run-public-smoke-checks";
export { main } from "./run-public-smoke-checks";

import { main } from "./run-public-smoke-checks";
import { scriptEntryMatches } from "./smoke/shared";

if (scriptEntryMatches(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error("[smoke] fatal error", error);
    process.exitCode = 1;
  });
}
