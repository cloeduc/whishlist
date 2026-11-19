#!/usr/bin/env node
// Store screenshots: plays .maestro/screenshots/store.yaml on an iOS simulator or an Android emulator, in each
// language, and writes the PNG files where fastlane expects them:
//   <out>/ios/<fr-FR|en-US>/NN-name.png                                  (deliver)
//   <out>/android/<fr-FR|en-US>/images/phoneScreenshots/NN-name.png      (supply)
// Prerequisites: the demo server on http://localhost:3010 (README of .maestro), the app built in Release
// against it and installed, DEMO_PASSWORD in the environment.
//   node scripts/store-screenshots.mjs --platform ios [--device <udid>] [--langs fr,en] [--out ../tmp/store-screenshots]
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const mobile = resolve(import.meta.dirname, "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs), []),
);
const platform = args.platform;
if (platform !== "ios" && platform !== "android") fail("--platform ios|android is required");
if (!process.env.DEMO_PASSWORD) fail("DEMO_PASSWORD is required (password of the demo accounts)");
const langs = (args.langs ?? "fr,en").split(",");
const out = resolve(args.out ?? join(mobile, "../tmp/store-screenshots"));

/** Store locale of each language, and the idea typed on the « new idea » screen. */
const LOCALES = {
  fr: { store: "fr-FR", apple: "fr_FR", android: "fr-FR", idea: "Casque audio sans fil", description: "Pour mes trajets en train, de préférence noir." },
  en: { store: "en-US", apple: "en_US", android: "en-US", idea: "Wireless headphones", description: "Black please, for long train rides." },
};

function fail(message) {
  console.error(message);
  process.exit(2);
}

function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], ...options }).trim();
}

/** iOS: the device's language is read at boot, so the simulator restarts with it. Clean status bar. */
function prepareIos(device, locale) {
  run("xcrun", ["simctl", "spawn", device, "defaults", "write", "Apple Global Domain", "AppleLanguages", "-array", locale.apple.split("_")[0]]);
  run("xcrun", ["simctl", "spawn", device, "defaults", "write", "Apple Global Domain", "AppleLocale", "-string", locale.apple]);
  spawnSync("xcrun", ["simctl", "shutdown", device]);
  run("xcrun", ["simctl", "boot", device]);
  run("xcrun", ["simctl", "bootstatus", device]);
  run("xcrun", ["simctl", "status_bar", device, "override", "--time", "9:41", "--dataNetwork", "wifi", "--wifiMode", "active", "--wifiBars", "3", "--cellularMode", "active", "--cellularBars", "4", "--batteryState", "charged", "--batteryLevel", "100"]);
}

/**
 * Android: the app's own language (Android 13+, no root needed on a Google Play image), the local server
 * through adb reverse, and a demo mode status bar.
 */
function prepareAndroid(device, locale) {
  const adb = (...rest) => run("adb", ["-s", device, ...rest]);
  adb("shell", "cmd", "locale", "set-app-locales", "app.ohyoushouldnt.mobile", "--locales", locale.android);
  adb("reverse", "tcp:3010", "tcp:3010");
  adb("shell", "settings", "put", "global", "sysui_demo_allowed", "1");
  const demo = (command, extras = []) =>
    adb("shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", command, ...extras);
  demo("enter");
  demo("clock", ["-e", "hhmm", "0941"]);
  demo("battery", ["-e", "level", "100", "-e", "plugged", "false"]);
  demo("network", ["-e", "wifi", "show", "-e", "level", "4"]);
  demo("notifications", ["-e", "visible", "false"]);
}

/** Android: gives the device back its own status bar, app language and ports. */
function restoreAndroid(device) {
  const adb = (...rest) => run("adb", ["-s", device, ...rest]);
  adb("shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "exit");
  adb("shell", "settings", "put", "global", "sysui_demo_allowed", "0");
  adb("shell", "cmd", "locale", "set-app-locales", "app.ohyoushouldnt.mobile", "--locales", "");
  adb("reverse", "--remove", "tcp:3010");
}

function defaultDevice() {
  if (args.device) return args.device;
  if (platform === "ios") {
    const booted = JSON.parse(run("xcrun", ["simctl", "list", "devices", "booted", "-j"])).devices;
    const devices = Object.values(booted).flat().filter((d) => d.deviceTypeIdentifier.endsWith("iPhone-17-Pro-Max"));
    if (devices.length !== 1) fail("Boot exactly one iPhone 17 Pro Max simulator (6.9\"), or pass --device <udid>");
    return devices[0].udid;
  }
  // An emulator unless a phone is named with --device: the flow clears the app's data and changes its
  // language and the status bar.
  const serials = run("adb", ["devices"])
    .split("\n")
    .slice(1)
    .filter((line) => line.endsWith("device"))
    .map((line) => line.split("\t")[0])
    .filter((serial) => serial.startsWith("emulator-"));
  if (serials.length !== 1) fail("Start exactly one Android emulator, or pass --device <serial> (a phone too)");
  return serials[0];
}

const device = defaultDevice();
for (const lang of langs) {
  const locale = LOCALES[lang];
  if (!locale) fail(`Unknown language: ${lang}`);
  const folder =
    platform === "ios" ? join(out, "ios", locale.store) : join(out, "android", locale.store, "images", "phoneScreenshots");
  rmSync(folder, { recursive: true, force: true });
  mkdirSync(folder, { recursive: true });
  console.log(`${platform} ${locale.store}: preparing ${device}`);
  if (platform === "ios") prepareIos(device, locale);
  else prepareAndroid(device, locale);
  // Maestro writes screenshots only into its output folder: copied from there afterwards.
  const maestroOut = mkdtempSync(join(tmpdir(), "store-screenshots-"));
  const result = spawnSync(
    "maestro",
    [
      "--device",
      device,
      "test",
      `--test-output-dir=${maestroOut}`,
      "-e",
      `NAME=${locale.idea}`,
      "-e",
      `DESCRIPTION=${locale.description}`,
      join(mobile, ".maestro/screenshots/store.yaml"),
    ],
    // The password goes through the environment (MAESTRO_*), never as an argument.
    { stdio: "inherit", env: { ...process.env, MAESTRO_DEMO_PASSWORD: process.env.DEMO_PASSWORD } },
  );
  if (platform === "android") restoreAndroid(device);
  if (result.status !== 0) fail(`Maestro failed for ${locale.store} (logs: ${maestroOut})`);
  for (const file of readdirSync(maestroOut, { recursive: true })) {
    const name = String(file).split("/").pop();
    if (/^\d\d-.*\.png$/.test(name)) copyFileSync(join(maestroOut, String(file)), join(folder, name));
  }
  rmSync(maestroOut, { recursive: true, force: true });
  console.log(`${locale.store}: ${readdirSync(folder).join(", ")}`);
}
