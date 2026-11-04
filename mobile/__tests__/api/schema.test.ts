import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The API contract is the source of truth (R9): the app's types must be an exact copy of it.
test("src/api/schema.d.ts is up to date with the API contract (npm run api:types)", () => {
  const root = join(__dirname, "../..");
  const out = join(mkdtempSync(join(tmpdir(), "schema-")), "schema.d.ts");
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/openapi-typescript/bin/cli.js"),
      join(root, "../specs/004-mobile-api/contracts/openapi.yaml"),
      "-o",
      out,
    ],
    { stdio: "ignore" },
  );
  expect(readFileSync(out, "utf8")).toBe(readFileSync(join(root, "src/api/schema.d.ts"), "utf8"));
});
