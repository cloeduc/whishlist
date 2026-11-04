// Dry-run check, writes nothing: `npm run db:check -- <file.json|file.db> [--counts]`.
// To run on a copy of prod before deploying the version that imports the old file.
import path from "node:path";
import process from "node:process";
import type { Database as Doc } from "../src/domain/types";
import { readDatabaseFile } from "../src/store/connection";
import { checkDocument, LegacyImportError, loadLegacyDocument } from "../src/store/legacy-json";

const args = process.argv.slice(2);
const counts = args.includes("--counts");
const target = args.find((arg) => !arg.startsWith("--"));
if (!target) {
  console.error("Usage: npm run db:check -- <file.json|file.db> [--counts]");
  process.exit(2);
}
const file = path.resolve(target);

function load(): Doc {
  return file.endsWith(".db") ? readDatabaseFile(file) : loadLegacyDocument(file);
}

let doc: Doc;
try {
  doc = load();
} catch (error) {
  if (!(error instanceof LegacyImportError)) throw error;
  console.error(error.message);
  process.exit(1);
}

const problems = checkDocument(doc);
if (counts) {
  for (const [name, rows] of Object.entries(doc)) console.log(`${name} ${(rows as unknown[]).length}`);
}
if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("no problem");
