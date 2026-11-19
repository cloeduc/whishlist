import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const mobile = join(__dirname, "..");
const repo = join(mobile, "..");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Value imports of a file (type-only imports are erased and never reach the phone). */
function imports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?from\s+"([^"]+)";/gm)].map((match) => match[1]);
}

function resolveFile(from: string, spec: string): string | null {
  const base = resolve(dirname(from), spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")];
  return candidates.find((candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate)) ?? null;
}

// The app reuses pure modules of the site (AGENTS.md): none of them, directly or not, may need Node
// or the server, which the phone does not have (028: `read.ts` once reached `node:crypto`).
test("the site modules the app imports never reach a Node or server module", () => {
  const seen = new Set<string>();
  const offending: string[] = [];
  const queue = [...sources(join(mobile, "app")), ...sources(join(mobile, "src"))].flatMap((file) =>
    imports(file)
      .filter((spec) => spec.startsWith("."))
      .map((spec) => resolveFile(file, spec))
      .filter((target): target is string => target !== null && !target.startsWith(mobile)),
  );
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of imports(file)) {
      if (spec.startsWith("node:") || spec === "server-only" || spec.startsWith("next/")) {
        offending.push(`${relative(repo, file)} → ${spec}`);
      } else if (spec.startsWith(".")) {
        const target = resolveFile(file, spec);
        if (target) queue.push(target);
      }
    }
  }
  expect(seen.size).toBeGreaterThan(5);
  expect(offending).toEqual([]);
});
