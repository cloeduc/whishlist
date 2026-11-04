// Header of a Maestro flow (before `---`): `name` and `tags`, read by the runner (flows not to run
// on iOS) and by the story coverage test. Read line by line, without a YAML dependency.
const { existsSync, readdirSync, readFileSync } = require("node:fs");
const path = require("node:path");

/** @param {string} source  @param {string} fallbackName */
function parseFlowHeader(source, fallbackName) {
  const header = source.split(/^---$/m)[0];
  const name = header.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? fallbackName;
  /** @type {string[]} */
  const tags = [];
  const block = header.match(/^tags:\s*\n((?:[ \t]+-.*\n?)+)/m);
  if (block) {
    for (const line of block[1].split("\n")) {
      const tag = line.match(/^\s+-\s*["']?([^"'\s]+)/)?.[1];
      if (tag) tags.push(tag);
    }
  }
  return { name, tags };
}

/** @param {string} file */
function readFlowHeader(file) {
  return { file, ...parseFlowHeader(readFileSync(file, "utf8"), path.basename(file, ".yaml")) };
}

/**
 * Flows to run: with no argument, all those of `flowsDir` (sorted); otherwise the given files,
 * relative to `mobileRoot` or absolute. A missing file stops everything (code 2 in the runner).
 * @param {string[]} args  @param {{ mobileRoot: string, flowsDir: string }} dirs
 * @returns {{ ok: true, files: string[] } | { ok: false, message: string }}
 */
function resolveFlowPaths(args, { mobileRoot, flowsDir }) {
  if (args.length === 0) {
    const files = readdirSync(flowsDir)
      .filter((file) => file.endsWith(".yaml"))
      .sort()
      .map((file) => path.join(flowsDir, file));
    return { ok: true, files };
  }
  const files = [];
  for (const arg of args) {
    const file = path.isAbsolute(arg) ? arg : path.resolve(mobileRoot, arg);
    if (!existsSync(file)) return { ok: false, message: `Flow not found: ${arg}` };
    files.push(file);
  }
  return { ok: true, files };
}

/** Tag of the flows not to run on this platform: `android-only` on iOS, `ios-only` on Android. */
function excludedTag(platform) {
  return platform === "ios" ? "android-only" : "ios-only";
}

/** Flows that do not run on this platform. */
function skippedOn(platform, flows) {
  return flows.filter((flow) => flow.tags.includes(excludedTag(platform)));
}

module.exports = { excludedTag, parseFlowHeader, readFlowHeader, resolveFlowPaths, skippedOn };
