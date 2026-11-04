import { execFileSync } from "node:child_process";
import { join } from "node:path";

import type { ExpoConfig } from "expo/config";

import { androidPathPrefixes } from "../../../src/site/app-links";

/** Expo config computed with these environment variables (read when the file loads). */
function configWith(env: { EXPO_PUBLIC_API_URL?: string; APP_VARIANT?: string }): ExpoConfig {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  try {
    let config: ExpoConfig | undefined;
    jest.isolateModules(() => {
      const build = require("../../app.config").default as (ctx: { config: object }) => ExpoConfig;
      config = build({ config: {} });
    });
    return config!;
  } finally {
    process.env = saved;
  }
}

describe("site links opened by the app (011)", () => {
  it("HTTPS server: associated domain on iOS, each prefix of the table on Android", () => {
    const config = configWith({ EXPO_PUBLIC_API_URL: "https://ohyoushouldnt.app", APP_VARIANT: "production" });
    expect(config.ios?.associatedDomains).toEqual(["applinks:ohyoushouldnt.app"]);
    const filter = config.android?.intentFilters?.[0];
    expect(filter?.autoVerify).toBe(true);
    const data = Array.isArray(filter?.data) ? filter.data : [];
    expect(data.map((entry) => entry.pathPrefix)).toEqual(androidPathPrefixes());
    expect(data.every((entry) => entry.scheme === "https" && entry.host === "ohyoushouldnt.app")).toBe(true);
  });

  it("local HTTP server or development variant: nothing is declared", () => {
    for (const env of [
      { EXPO_PUBLIC_API_URL: "http://localhost:3010", APP_VARIANT: "production" },
      { EXPO_PUBLIC_API_URL: "https://ohyoushouldnt.app", APP_VARIANT: "development" },
    ]) {
      const config = configWith(env);
      expect(config.ios?.associatedDomains).toBeUndefined();
      expect(config.android?.intentFilters).toBeUndefined();
    }
  });
});

// Expo's config loader (the one used by `expo run` and EAS builds) does not compile TypeScript imported
// from outside mobile/, unlike jest: we run it for real.
it("Expo's real loader reads app.config.ts, with the app links in production", () => {
  const root = join(__dirname, "../..");
  const output = execFileSync(join(root, "node_modules/.bin/expo"), ["config", "--json"], {
    cwd: root,
    env: { ...process.env, EXPO_PUBLIC_API_URL: "https://ohyoushouldnt.app", APP_VARIANT: "production" },
    encoding: "utf8",
  });
  const config = JSON.parse(output) as ExpoConfig;
  expect(config.ios?.associatedDomains).toEqual(["applinks:ohyoushouldnt.app"]);
  const data = config.android?.intentFilters?.[0]?.data;
  expect((Array.isArray(data) ? data : []).map((entry) => entry.pathPrefix)).toEqual(androidPathPrefixes());
}, 60000);
