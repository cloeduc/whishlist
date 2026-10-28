import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const CONTRACT = path.join(process.cwd(), "specs/004-mobile-api/contracts/openapi.yaml");
const METHODS = ["get", "post", "put", "patch", "delete"] as const;

/** Chemins et méthodes du contrat (`paths:` à 2 espaces, méthodes à 4), sans dépendance YAML. */
function contractOperations(): Map<string, Set<string>> {
  const operations = new Map<string, Set<string>>();
  let inPaths = false;
  let current: string | null = null;
  for (const line of readFileSync(CONTRACT, "utf8").split("\n")) {
    if (/^\S/.test(line)) inPaths = line.startsWith("paths:");
    if (!inPaths) continue;
    const pathMatch = /^ {2}(\/\S*):\s*$/.exec(line);
    if (pathMatch) {
      current = pathMatch[1]!;
      operations.set(current, new Set());
      continue;
    }
    const methodMatch = /^ {4}(get|post|put|patch|delete):\s*$/.exec(line);
    if (methodMatch && current) operations.get(current)!.add(methodMatch[1]!.toUpperCase());
  }
  return operations;
}

function exportedMethods(source: string): Set<string> {
  const found = new Set<string>();
  for (const method of METHODS) {
    const name = method.toUpperCase();
    if (new RegExp(`export (const|async function) ${name}\\b`).test(source)) found.add(name);
    if (new RegExp(`export const \\{[^}]*\\b${name}\\b[^}]*\\}`).test(source)) found.add(name);
  }
  return found;
}

test("chaque opération du contrat a sa route", () => {
  const operations = contractOperations();
  assert.ok(operations.size > 20, "le contrat est lu");
  for (const [route, methods] of operations) {
    const dir = route.replace(/\{(\w+)\}/g, "[$1]");
    const file = path.join(process.cwd(), "app/api/v1", dir, "route.ts");
    assert.ok(existsSync(file), `route manquante pour ${route} : ${file}`);
    const exported = exportedMethods(readFileSync(file, "utf8"));
    for (const method of methods) assert.ok(exported.has(method), `${method} ${route} n'est pas exporté`);
  }
});
