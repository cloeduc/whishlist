// Language of the checked strings (R8): --lang, then E2E_LANG, then the device language, like the app.
const { execFileSync } = require("node:child_process");

function explicit(value, source) {
  if (value === undefined || value === null || value === "") return null;
  if (value !== "fr" && value !== "en") throw new Error(`${source} must be fr or en (got: ${value}).`);
  return value;
}

/** First device language (« en-US », « en_GB » or the AppleLanguages list) → en; anything else → fr. */
function fromDevice(deviceLocale) {
  const first = String(deviceLocale ?? "").match(/[a-zA-Z]{2,3}(?:[-_][a-zA-Z0-9]+)*/);
  return first && first[0].toLowerCase().split(/[-_]/)[0] === "en" ? "en" : "fr";
}

/** @param {{ flag?: string | null, env?: string | null, deviceLocale?: string | null }} options */
function resolveLang({ flag, env, deviceLocale }) {
  return explicit(flag, "--lang") ?? explicit(env, "E2E_LANG") ?? fromDevice(deviceLocale);
}

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

function readDeviceLocale(platform, deviceId) {
  if (platform === "ios") return run("xcrun", ["simctl", "spawn", deviceId, "defaults", "read", "-g", "AppleLanguages"]);
  return (
    run("adb", ["-s", deviceId, "shell", "getprop", "persist.sys.locale"]) ??
    run("adb", ["-s", deviceId, "shell", "getprop", "ro.product.locale"])
  );
}

module.exports = { resolveLang, readDeviceLocale };
