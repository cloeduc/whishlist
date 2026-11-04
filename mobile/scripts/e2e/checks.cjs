// Prerequisites of the suite (FR-012), checked before the first flow.
// Each check returns { ok: true, … } or { ok: false, message } with what to do.
const { execFileSync } = require("node:child_process");

const APP_ID = "app.ohyoushouldnt.mobile";
// 10.0.2.2 is the Mac's alias only as seen from the Android emulator; as seen from the Mac, where the runner runs,
// it is a local network address.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** The suite never targets production (R4). */
function isLocalApiUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

function tryRun(command, args) {
  try {
    return run(command, args);
  } catch {
    return null;
  }
}

function findMaestro() {
  if (tryRun("maestro", ["--version"]) !== null) return { ok: true };
  return { ok: false, message: "Maestro not found: curl -Ls https://get.maestro.mobile.dev | bash" };
}

/** Booted iOS simulators and connected Android devices. */
function listDevices() {
  const devices = [];
  const simctl = tryRun("xcrun", ["simctl", "list", "devices", "booted", "-j"]);
  if (simctl) {
    for (const list of Object.values(JSON.parse(simctl).devices ?? {})) {
      for (const device of list) {
        if (device.state === "Booted") devices.push({ platform: "ios", id: device.udid, name: device.name });
      }
    }
  }
  const adb = tryRun("adb", ["devices"]);
  if (adb) {
    for (const line of adb.split("\n").slice(1)) {
      const [id, state] = line.trim().split(/\s+/);
      if (id && state === "device") devices.push({ platform: "android", id, name: id });
    }
  }
  return devices;
}

function pickDevice(devices, platform) {
  const candidates = platform ? devices.filter((d) => d.platform === platform) : devices;
  if (candidates.length === 1) return { ok: true, device: candidates[0] };
  if (candidates.length === 0) {
    const message =
      platform === "android"
        ? "No Android emulator running."
        : platform === "ios"
          ? "No iOS simulator booted."
          : "No iOS simulator booted and no Android emulator running.";
    return { ok: false, message };
  }
  if (!platform && new Set(candidates.map((d) => d.platform)).size > 1) {
    return { ok: false, message: "Several devices: pass --platform ios or --platform android." };
  }
  return { ok: false, message: `Several ${candidates[0].platform} devices running: keep only one.` };
}

function isAppInstalled(device) {
  const installed =
    device.platform === "ios"
      ? tryRun("xcrun", ["simctl", "get_app_container", device.id, APP_ID]) !== null
      : (tryRun("adb", ["-s", device.id, "shell", "pm", "path", APP_ID]) ?? "").includes("package:");
  if (installed) return { ok: true };
  const build =
    device.platform === "ios"
      ? "(cd mobile && EXPO_PUBLIC_API_URL=http://localhost:3010 npx expo run:ios --configuration Release)"
      : "(cd mobile && EXPO_PUBLIC_API_URL=http://localhost:3010 npx expo run:android --variant release)";
  return { ok: false, message: `The app is not installed on ${device.name}: ${build}` };
}

module.exports = { APP_ID, isLocalApiUrl, findMaestro, listDevices, pickDevice, isAppInstalled };
