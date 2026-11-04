import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

/**
 * Guard for the "Langue du code" convention of AGENTS.md: code comments, test titles and
 * Maestro flow names are written in English.
 * Product texts (locales/), documentation (specs/, docs/, *.md), versioned migrations and
 * generated files are out of scope.
 */

const SCRIPT_FILE = /\.(ts|tsx|js|mjs|cjs)$/;
const CSS_FILE = /\.css$/;
const HASH_FILE = /(\.(sh|ya?ml|toml)|(^|\/)(Dockerfile|\.dockerignore|\.gitignore|\.env\.example))$/;

const EXCLUDED = [
  /^locales\//,
  /^specs\//,
  /^docs\//,
  /^drizzle\//,
  /^public\/guide\//,
  /^\.specify\//,
  /^\.claude\//,
  /^next-env\.d\.ts$/,
  /^mobile\/src\/api\/schema\.d\.ts$/,
  /^mobile\/\.maestro\/scripts\/strings\.generated\.js$/,
];

/** Justified exceptions: `file:text` of a comment that is correct English despite the detector. */
const ALLOWED = new Set<string>([]);

/** Letters that English text practically never uses. */
const FRENCH_LETTERS = /[éèêëàâçîïôûùœ]/i;
/** French function words with no English homograph; one is enough to mark a French comment. */
const FRENCH_WORDS = new Set([
  ..."le la les un une des du au aux ce ces cette il elle ils elles leur est sont".split(" "),
  ..."pour dans avec sans sur par mais donc qui que pas ne se si".split(" "),
]);

/** Removes quoted product texts, which keep their language. */
function withoutQuotes(text: string): string {
  return text
    .replace(/«[^»]*»/g, " ")
    // A quote wrapped onto the next comment line
    .replace(/«[^»]*$/, " ")
    .replace(/^[^«]*»/, " ")
    .replace(/“[^”]*”/g, " ")
    .replace(/"[^"\n]*"/g, " ")
    .replace(/`[^`\n]*`/g, " ");
}

export function isFrench(text: string): boolean {
  const unquoted = withoutQuotes(text);
  if (FRENCH_LETTERS.test(unquoted)) return true;
  const words = new Set(unquoted.toLowerCase().match(/[a-z]+/g) ?? []);
  for (const word of words) if (FRENCH_WORDS.has(word)) return true;
  return false;
}

type Comment = { line: number; text: string };

/** Comments of a JS/TS file, read through the TypeScript parser (strings, regexes and JSX text are not comments). */
function scriptComments(file: string, source: string): Comment[] {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : /\.(js|mjs|cjs)$/.test(file) ? ts.ScriptKind.JSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, kind);
  const seen = new Set<number>();
  const comments: Comment[] = [];
  const collect = (ranges: ts.CommentRange[] | undefined) => {
    for (const range of ranges ?? []) {
      if (seen.has(range.pos)) continue;
      seen.add(range.pos);
      const start = sourceFile.getLineAndCharacterOfPosition(range.pos).line;
      source
        .slice(range.pos, range.end)
        .split("\n")
        .forEach((text, offset) => comments.push({ line: start + offset + 1, text }));
    }
  };
  const visit = (node: ts.Node) => {
    collect(ts.getLeadingCommentRanges(source, node.getFullStart()));
    collect(ts.getTrailingCommentRanges(source, node.getEnd()));
    for (const child of node.getChildren(sourceFile)) visit(child);
  };
  visit(sourceFile);
  return comments.filter((comment) => !comment.text.startsWith("#!"));
}

function cssComments(source: string): Comment[] {
  const comments: Comment[] = [];
  for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
    const start = source.slice(0, match.index).split("\n").length;
    match[0].split("\n").forEach((text, offset) => comments.push({ line: start + offset, text }));
  }
  return comments;
}

/** `#` comments: at the start of a line, or after a space outside quotes. */
function hashComments(source: string): Comment[] {
  const comments: Comment[] = [];
  source.split("\n").forEach((line, index) => {
    if (line.startsWith("#!")) return;
    let quote: string | null = null;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]!;
      if (quote) {
        if (char === "\\" && quote === '"') i += 1;
        else if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === "#" && (i === 0 || /\s/.test(line[i - 1]!))) {
        comments.push({ line: index + 1, text: line.slice(i) });
        return;
      }
    }
  });
  return comments;
}

function codeFiles(): string[] {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file && !EXCLUDED.some((pattern) => pattern.test(file)))
    .filter((file) => SCRIPT_FILE.test(file) || CSS_FILE.test(file) || HASH_FILE.test(file));
}

function commentsOf(file: string): Comment[] {
  const source = readFileSync(file, "utf8");
  if (SCRIPT_FILE.test(file)) return scriptComments(file, source);
  if (CSS_FILE.test(file)) return cssComments(source);
  return hashComments(source);
}

test("the detector tells French from English", () => {
  assert.equal(isFrench("// Garde la liste si elle existe"), true);
  assert.equal(isFrench("# on relance le serveur pour les tests"), true);
  assert.equal(isFrench("// on garde la liste"), true);
  assert.equal(isFrench("# relance du serveur"), true);
  assert.equal(isFrench("// Keeps the list when it exists"), false);
  assert.equal(isFrench(" * then shows « Remplir depuis le"), false);
  assert.equal(isFrench(" * lien » under the form"), false);
  assert.equal(isFrench("// Shows « Réserver ce cadeau » once the idea is free"), false);
  assert.equal(isFrench('// Matches "Réservé par vous" on the public page'), false);
});

test("code comments are in English", () => {
  const failures: string[] = [];
  for (const file of codeFiles()) {
    for (const { line, text } of commentsOf(file)) {
      if (isFrench(text) && !ALLOWED.has(`${file}:${text.trim()}`)) failures.push(`${file}:${line}: ${text.trim()}`);
    }
  }
  failures.sort();
  assert.equal(failures.length, 0, `French comments (AGENTS.md, « Langue du code »):\n${failures.join("\n")}`);
});

const TEST_FILE = /^(tests\/.*\.ts|mobile\/__tests__\/.*\.tsx?)$/;
const FLOW_FILE = /^mobile\/\.maestro\/(flows|subflows)\/.*\.ya?ml$/;
const TEST_FUNCTIONS = new Set(["test", "it", "describe"]);

/** `test`, `it`, `describe`, also as `test.skip`, `describe.each(…)`. */
function isTestCall(callee: ts.Expression): boolean {
  if (ts.isIdentifier(callee)) return TEST_FUNCTIONS.has(callee.text);
  if (ts.isPropertyAccessExpression(callee)) return isTestCall(callee.expression);
  if (ts.isCallExpression(callee)) return isTestCall(callee.expression);
  return false;
}

/** Literal titles of the tests of a file. */
function testTitles(file: string, source: string): Comment[] {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const titles: Comment[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isTestCall(node.expression)) {
      const title = node.arguments[0];
      if (title && (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title))) {
        titles.push({ line: sourceFile.getLineAndCharacterOfPosition(title.getStart()).line + 1, text: title.text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return titles;
}

/** The top-level `name:` of a Maestro flow. */
function flowNames(source: string): Comment[] {
  const names: Comment[] = [];
  source.split("\n").forEach((line, index) => {
    const match = /^name:\s*["']?(.*?)["']?\s*$/.exec(line);
    if (match) names.push({ line: index + 1, text: match[1]! });
  });
  return names;
}

test("test titles and flow names are in English", () => {
  const failures: string[] = [];
  for (const file of codeFiles()) {
    const source = () => readFileSync(file, "utf8");
    const titles = TEST_FILE.test(file) ? testTitles(file, source()) : FLOW_FILE.test(file) ? flowNames(source()) : [];
    for (const { line, text } of titles) {
      if (isFrench(text) && !ALLOWED.has(`${file}:${text}`)) failures.push(`${file}:${line}: ${text}`);
    }
  }
  failures.sort();
  assert.equal(failures.length, 0, `French test titles or flow names (AGENTS.md, « Langue du code »):\n${failures.join("\n")}`);
});
