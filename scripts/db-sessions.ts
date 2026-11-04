// Number of API sessions of an account: `node --import tsx scripts/db-sessions.ts <WISHLIST_DATA_PATH> <userId>`.
// Used by the e2e server check (mobile/scripts/e2e.mjs); read-only. Output: a number, 0 if the database is missing.
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { databaseFilePath, readDatabaseFile } from "../src/store/connection";

const [dataPath, userId] = process.argv.slice(2);
if (!dataPath || !userId) {
  console.error("Usage: node --import tsx scripts/db-sessions.ts <WISHLIST_DATA_PATH> <userId>");
  process.exit(2);
}
const file = databaseFilePath(path.resolve(dataPath));
const sessions = existsSync(file) ? readDatabaseFile(file).apiSessions : [];
console.log(sessions.filter((session) => session.userId === userId).length);
