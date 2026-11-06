// Runs after `next build` (npm `postbuild`): completes `.next/standalone` with what its `server.js`
// needs at run time and does not copy itself. The Docker image and `npm start` then run the same folder.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.error('No .next/standalone/server.js: check that next.config.ts keeps output: "standalone".');
  process.exit(1);
}

const copies = [
  ["public", "public"],
  [".next/static", ".next/static"],
  // Migrations applied when the database opens (src/store/connection.ts).
  ["drizzle", "drizzle"],
  // Generic fixture the Docker image has always shipped.
  ["data/seed.json", "data/seed.json"],
];

for (const [from, to] of copies) {
  const target = path.join(standalone, to);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(path.join(root, from), target, { recursive: true });
}
console.log(`Standalone server ready: ${copies.map(([, to]) => to).join(", ")} copied into .next/standalone.`);
