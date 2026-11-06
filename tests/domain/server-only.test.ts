import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Guard for AGENTS.md (Couches): every file of src/store, src/auth and src/server starts with
 * `import "server-only";`, so a client component that imports one fails the build with a clear message.
 */

const ROOTS = ["src/store", "src/auth", "src/server"];

const EXCLUDED = new Map([
  // "use server" file: client components import it on purpose, the compiler turns it into references.
  ["src/server/actions.ts", "server actions"],
  // Loaded by `drizzle-kit generate` outside Next, without the react-server condition.
  ["src/store/schema.ts", "drizzle-kit"],
]);

function serverFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".d.ts"))
    .map((file) => path.posix.join(dir, file.split(path.sep).join("/")));
}

/** First statement of the file, after comments and a leading directive ("use server"…). */
function firstImport(source: string): string | null {
  const lines = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//") && !/^["']use \w+["'];?$/.test(line));
  return lines[0] ?? null;
}

test("every server file imports server-only first", () => {
  const files = ROOTS.flatMap(serverFiles).filter((file) => !EXCLUDED.has(file));
  assert.ok(files.length > 20, `only ${files.length} server files found`);
  const missing = files.filter((file) => firstImport(readFileSync(file, "utf8")) !== 'import "server-only";');
  assert.deepEqual(missing, []);
});

test("the excluded files still exist", () => {
  for (const file of EXCLUDED.keys()) assert.ok(readFileSync(file, "utf8").length > 0, file);
});
