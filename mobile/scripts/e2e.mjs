// E2E suite of the mobile app (Maestro): prerequisites, fresh demo database, expected strings, flows, summary.
// Usage: DEMO_PASSWORD=… npm --prefix mobile run e2e -- [--platform ios|android] [--lang fr|en] [flow.yaml…]
// Contract: specs/007-mobile-e2e-maestro/contracts/e2e-command.md; guide: mobile/.maestro/README.md.
import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import checks from "./e2e/checks.cjs";
import flowFiles from "./e2e/flows.cjs";
import junit from "./e2e/junit.cjs";
import locale from "./e2e/locale.cjs";
import strings from "./e2e/strings.cjs";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.join(mobileRoot, "..");
const suiteDir = path.join(mobileRoot, ".maestro");
const dataFile = path.join(repoRoot, "tmp/e2e/wishlist.json");
const SKIP_REASON = {
  ios: "the iOS simulator cannot cut the app's network",
  android: "sharing into the app goes through Safari and the iOS share sheet",
};

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = { platform: undefined, lang: undefined, flows: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--platform" || arg === "--lang") {
      const value = argv[(i += 1)];
      if (!value) fail(`${arg} expects a value.`);
      options[arg.slice(2)] = value;
    } else if (arg.startsWith("--platform=") || arg.startsWith("--lang=")) {
      const [key, value] = arg.slice(2).split("=");
      options[key] = value;
    } else if (arg.startsWith("--")) {
      fail(`Unknown option: ${arg}`);
    } else {
      options.flows.push(arg);
    }
  }
  if (options.platform && options.platform !== "ios" && options.platform !== "android") {
    fail("--platform must be ios or android.");
  }
  return options;
}

/**
 * Fresh demo database (tmp/e2e/wishlist.db), replaced in one transaction: the server running on it
 * never sees a half-written database, and reads the new demo on the next request.
 */
function resetDatabase() {
  mkdirSync(path.dirname(dataFile), { recursive: true });
  const result = spawnSync("node", ["--import", "tsx", "scripts/create-demo-data.mjs", dataFile], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (result.status !== 0) fail(`Demo database not created: ${result.stderr.trim() || result.stdout.trim()}`);
}

function apiSessionCount(userId) {
  const result = spawnSync("node", ["--import", "tsx", "scripts/db-sessions.ts", dataFile, userId], { cwd: repoRoot, encoding: "utf8" });
  return result.status === 0 ? Number(result.stdout.trim()) : 0;
}

async function request(url, init) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  } catch {
    return null;
  }
}

function serverHint(apiUrl) {
  const port = new URL(apiUrl).port || "80";
  return `MAIL_SMTP_URL=smtp://localhost:1025 WISHLIST_DATA_PATH=tmp/e2e/wishlist.json npm run dev -- --port ${port}`;
}

const MAILDEV_HINT = "npx maildev@3.0.0 --smtp 1025 --web 1080";

/**
 * The server's emails arrive in MailDev (010): the flows read the confirmation links there.
 * The inbox is emptied before the suite, so that a flow never reads the link of a previous run.
 */
async function checkMailDev(maildevUrl, capabilities) {
  const health = await request(`${maildevUrl}/api/healthz`);
  if (!health?.ok) fail(`MailDev unreachable at ${maildevUrl}: ${MAILDEV_HINT}`);
  if (!capabilities.mail) fail(`The server does not send emails: restart it with MAIL_SMTP_URL=smtp://localhost:1025`);
  await request(`${maildevUrl}/api/email/all`, { method: "DELETE" });
}

/** The server responds, and it really reads the tmp/e2e/ database (R3): a sign-in must leave a session there. */
async function checkServer(apiUrl, password) {
  const capabilities = await request(`${apiUrl}/api/v1/capabilities`);
  if (!capabilities?.ok) fail(`Server unreachable at ${apiUrl}: ${serverHint(apiUrl)}`);
  const configured = await capabilities.json();
  const login = await request(`${apiUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "alex@example.test", password }),
  });
  const reads = login?.ok && apiSessionCount("demo-owner") > 0;
  if (login?.ok) {
    const { token } = await login.json();
    await request(`${apiUrl}/api/v1/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
  }
  if (!reads) fail(`The server does not read the tmp/e2e/ database: restart it with ${serverHint(apiUrl)}`);
  return configured;
}

/** Version shown by « Mon compte » (`Constants.expoConfig.version`), read from app.config.ts. */
function appVersion() {
  const config = readFileSync(path.join(mobileRoot, "app.config.ts"), "utf8");
  return config.match(/^\s*version:\s*"([^"]+)"/m)?.[1] ?? "";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const resolved = flowFiles.resolveFlowPaths(options.flows, { mobileRoot, flowsDir: path.join(suiteDir, "flows") });
  if (!resolved.ok) fail(resolved.message);
  const flows = resolved.files.map(flowFiles.readFlowHeader).map((flow) => ({ ...flow, id: path.basename(flow.file, ".yaml") }));

  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 10) fail("DEMO_PASSWORD is required (at least 10 characters).");
  const maestro = checks.findMaestro();
  if (!maestro.ok) fail(maestro.message);
  const apiUrl = (process.env.E2E_API_URL ?? "http://localhost:3010").replace(/\/+$/, "");
  if (!checks.isLocalApiUrl(apiUrl)) fail("E2E_API_URL must target a local server (localhost or 127.0.0.1).");
  const maildevUrl = (process.env.E2E_MAILDEV_URL ?? "http://localhost:1080").replace(/\/+$/, "");
  if (!checks.isLocalApiUrl(maildevUrl)) fail("E2E_MAILDEV_URL must target a local MailDev (localhost or 127.0.0.1).");
  const picked = checks.pickDevice(checks.listDevices(), options.platform);
  if (!picked.ok) fail(picked.message);
  const { device } = picked;
  const installed = checks.isAppInstalled(device);
  if (!installed.ok) fail(installed.message);

  let lang;
  try {
    lang = locale.resolveLang({
      flag: options.lang,
      env: process.env.E2E_LANG,
      deviceLocale: options.lang || process.env.E2E_LANG ? null : locale.readDeviceLocale(device.platform, device.id),
    });
  } catch (error) {
    fail(error.message);
  }

  resetDatabase();
  const capabilities = await checkServer(apiUrl, password);
  await checkMailDev(maildevUrl, capabilities);

  // The compiled app targets localhost: on Android, the Mac's port goes through adb (R10).
  if (device.platform === "android") {
    const port = new URL(apiUrl).port || "80";
    execFileSync("adb", ["-s", device.id, "reverse", `tcp:${port}`, `tcp:${port}`], { stdio: "ignore" });
  }

  writeFileSync(path.join(suiteDir, "scripts/strings.generated.js"), strings.renderStringsScript(strings.buildStrings(lang, repoRoot)));

  const skipped = flowFiles.skippedOn(device.platform, flows);
  const toRun = flows.filter((flow) => !skipped.includes(flow));
  const startedAt = new Date();
  const outputDir = path.join(repoRoot, "tmp/e2e/results", `${junit.formatStamp(startedAt)}-${device.platform}`);
  mkdirSync(outputDir, { recursive: true });
  const report = path.join(outputDir, "report.xml");

  let results = [];
  if (toRun.length > 0) {
    const targets = options.flows.length === 0 ? [suiteDir] : toRun.map((flow) => flow.file);
    const args = [
      "test",
      "--device",
      device.id,
      "--format",
      "junit",
      "--output",
      report,
      "--test-output-dir",
      outputDir,
      "-e",
      `APP_VERSION=${appVersion()}`,
      // App language: the decimal keypad has a comma in French, a period in English.
      "-e",
      `APP_LANG=${lang}`,
      // Debug build: the Metro that the dev client launcher must open after the app is cleared.
      "-e",
      `METRO_URL=${encodeURIComponent(process.env.E2E_METRO_URL ?? "http://localhost:8081")}`,
      // The suite's inbox: the flows read the confirmation links there (010).
      "-e",
      `MAILDEV_URL=${maildevUrl}`,
      "--exclude-tags",
      flowFiles.excludedTag(device.platform),
      ...targets,
    ];
    // The password goes through the environment (Maestro reads the MAESTRO_* variables), never as a process
    // argument: it would be visible to any user of the machine with `ps`.
    spawnSync("maestro", args, { cwd: mobileRoot, stdio: "inherit", env: { ...process.env, MAESTRO_DEMO_PASSWORD: password } });
    results = junit.withMissing(existsSync(report) ? junit.parseJunit(readFileSync(report, "utf8")) : [], toRun);
  }

  // Screenshots taken by Maestro (including the one of the screen at a failure), under the flow's line.
  const pngPaths = readdirSync(outputDir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".png"))
    .map((file) => path.relative(repoRoot, path.join(outputDir, file)));

  const summary = junit.formatSummary({
    platform: device.platform,
    lang,
    startedAt,
    results,
    skipped: skipped.map((flow) => ({ id: flow.id, name: flow.name, reason: SKIP_REASON[device.platform] })),
    outputDir: path.relative(repoRoot, outputDir),
    captures: junit.capturesByFlow(pngPaths, results),
  });
  writeFileSync(path.join(outputDir, "summary.txt"), `${summary}\n`);
  console.log(`\n${summary}`);
  process.exit(junit.exitCode(results));
}

await main();
