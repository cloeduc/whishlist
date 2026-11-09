import type { ConfigContext, ExpoConfig } from "expo/config";

import commonEn from "../locales/en/common.json";
import commonFr from "../locales/fr/common.json";
import mobileEn from "../locales/en/mobile.json";
import mobileFr from "../locales/fr/mobile.json";
import appLinkRoutes from "../src/site/app-link-routes.json";
import legacyPaths from "../src/site/legacy-paths.json";

// The server address is set at build time (FR-042): local demo, production…
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Build variant (`APP_VARIANT`, set by the `eas.json` profiles):
 * - `development`: development client that loads the JavaScript from Metro, installed next to
 *   the app (its own identifier and its own name), with the component catalog;
 * - `production` (default, including for `expo run:ios|android`): the app itself.
 */
const APP_VARIANT = process.env.APP_VARIANT ?? "production";
const IS_DEV = APP_VARIANT === "development";

const PACKAGE = IS_DEV ? "app.ohyoushouldnt.mobile.dev" : "app.ohyoushouldnt.mobile";

/**
 * Site links opened by the app (feature 011): only for an HTTPS server, the one of the store builds.
 * The domain publishes the association files (`/.well-known/…`); the development variant is not in them.
 */
const APP_LINK_DOMAIN = IS_DEV ? null : (/^https:\/\/([^/:]+)/.exec(apiUrl)?.[1] ?? null);
// Copy of `legacySitePatterns()` (src/site/legacy-paths.ts): Expo's config loader reads JSON but not that
// TypeScript module. `__tests__/links/app-config.test.ts` checks that both give the same prefixes.
const segments = (path: string) => path.split("/").slice(1);
/** Former French forms of the table's paths (feature 018): emails sent before the change still carry them. */
const LEGACY_SITE_PATTERNS = appLinkRoutes.flatMap(({ site }) =>
  legacyPaths.paths.flatMap((rule) => {
    const actual = segments(site);
    const to = segments(rule.to);
    if (actual.length < to.length || !to.every((part, index) => part === actual[index])) return [];
    return [`/${[...segments(rule.from), ...actual.slice(to.length)].join("/")}`];
  }),
);
/** Prefixes of the paths opened by the app, with and without `/en` (same computation as `androidPathPrefixes`, checked by a test). */
const APP_LINK_PREFIXES = [
  ...new Set(
    [...appLinkRoutes.map((route) => route.site), ...LEGACY_SITE_PATTERNS].flatMap((pattern) => [
      pattern.split(":")[0],
      `/en${pattern.split(":")[0]}`,
    ]),
  ),
];

function appName(brand: string) {
  return IS_DEV ? `${brand} (Dev)` : brand;
}

/** App name and text of the camera access request (scanning a list's QR code, 012), per language. */
function localized(brand: string, cameraUsage: string) {
  const name = appName(brand);
  return { ios: { CFBundleDisplayName: name, NSCameraUsageDescription: cameraUsage }, android: { app_name: name } };
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "tat-lonestone",
  name: appName(commonFr.brand),
  slug: "ohyoushouldnt",
  scheme: "ohyoushouldnt",
  version: "1.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/images/icon.png",
  backgroundColor: "#e8f0ff",
  locales: {
    fr: localized(commonFr.brand, mobileFr.shared.cameraUsage),
    en: localized(commonEn.brand, mobileEn.shared.cameraUsage),
  },
  ios: {
    bundleIdentifier: PACKAGE,
    supportsTablet: false,
    // Encryption: HTTPS only (exempt), so that TestFlight asks nothing on each build.
    infoPlist: { CFBundleAllowMixedLocalizations: true, ITSAppUsesNonExemptEncryption: false },
    ...(APP_LINK_DOMAIN ? { associatedDomains: [`applinks:${APP_LINK_DOMAIN}`] } : {}),
  },
  android: {
    package: PACKAGE,
    // Only permission: the camera, to scan the QR code of a list to follow (012, FR-012).
    permissions: ["android.permission.CAMERA"],
    ...(APP_LINK_DOMAIN
      ? {
          intentFilters: [
            {
              action: "VIEW",
              autoVerify: true,
              category: ["BROWSABLE", "DEFAULT"],
              data: APP_LINK_PREFIXES.map((pathPrefix) => ({ scheme: "https", host: APP_LINK_DOMAIN, pathPrefix })),
            },
          ],
        }
      : {}),
    adaptiveIcon: {
      backgroundColor: "#e8f0ff",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-sqlite",
    "expo-localization",
    "expo-font",
    // Receive a link shared from another app (« Ajouter à une liste »): links and text only.
    [
      "expo-sharing",
      {
        ios: { enabled: true, activationRule: { supportsText: true, supportsWebUrlWithMaxCount: 1 } },
        android: { enabled: true, singleShareMimeTypes: ["text/plain"] },
      },
    ],
    // Scan a list's QR code (012): camera only, no microphone or audio recording.
    [
      "expo-camera",
      { cameraPermission: mobileFr.shared.cameraUsage, microphonePermission: false, recordAudioAndroid: false },
    ],
    [
      "expo-splash-screen",
      { backgroundColor: "#e8f0ff", image: "./assets/images/splash-icon.png", imageWidth: 160 },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: {
      projectId: "b93d073b-d39f-46b2-abf8-e856996fbd9e",
    },
    APP_VARIANT,
    apiUrl,
    devCatalog: IS_DEV,
  },
});
