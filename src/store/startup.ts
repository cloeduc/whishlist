import "server-only";
import { openStore } from "./connection";
import { LegacyImportError } from "./legacy-json";

/** Opening at server startup (instrumentation.ts): a failure stops the process. */
export function openStoreOrExit(): void {
  try {
    openStore();
  } catch (error) {
    console.error("[store] cannot open the database, stopping the server.");
    console.error(error instanceof LegacyImportError ? error.message : error);
    process.exit(1);
  }
}
