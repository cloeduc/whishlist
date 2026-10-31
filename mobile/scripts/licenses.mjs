// Licences des paquets embarqués dans l'app (dépendances de production, directes et indirectes),
// lues dans node_modules et écrites dans src/legal/licenses.json, affichées par l'écran « Licences ».
// Usage : npm --prefix mobile run licenses, après chaque changement de dépendances de l'app.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tree = JSON.parse(
  execFileSync("npm", ["ls", "--omit=dev", "--all", "--json", "--long"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  }),
);

/** Champ `license` d'un package.json : chaîne, objet `{ type }` ou ancien tableau `licenses`. */
function licenseOf(pkg) {
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((entry) => entry.type ?? entry).join(" OR ");
  return "UNKNOWN";
}

// Texte standard, pour un paquet MIT publié sans fichier de licence (FR-041).
const MIT = `MIT License

Copyright (c) {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

function authorOf(pkg) {
  const author = typeof pkg.author === "string" ? pkg.author : pkg.author?.name;
  return author?.replace(/\s*[<(].*$/, "").trim() || `the ${pkg.name} authors`;
}

function licenseText(dir, pkg) {
  const file = readdirSync(dir)
    .sort()
    .find((name) => /^(licen[cs]e|copying)(\.|$|-)/i.test(name));
  if (file) return readFileSync(path.join(dir, file), "utf8").trim();
  return licenseOf(pkg) === "MIT" ? MIT.replace("{author}", authorOf(pkg)) : "";
}

const packages = new Map();
function walk(node) {
  for (const [name, child] of Object.entries(node.dependencies ?? {})) {
    if (!child.path || child.missing) continue;
    const key = `${name}@${child.version}`;
    if (packages.has(key)) continue;
    const pkg = JSON.parse(readFileSync(path.join(child.path, "package.json"), "utf8"));
    packages.set(key, { name, version: child.version, license: licenseOf(pkg), text: licenseText(child.path, pkg) });
    walk(child);
  }
}
walk(tree);

const entries = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
const out = path.join(root, "src/legal/licenses.json");
writeFileSync(out, `${JSON.stringify(entries, null, 1)}\n`);
console.log(`${entries.length} paquets → ${path.relative(root, out)}`);
const missing = entries.filter((entry) => !entry.text);
if (missing.length) console.warn(`Sans texte de licence : ${missing.map((entry) => `${entry.name}@${entry.version}`).join(", ")}`);
