import type { ConfigContext, ExpoConfig } from "expo/config";

import commonEn from "../locales/en/common.json";
import commonFr from "../locales/fr/common.json";

// L'adresse du serveur est fixée au build (FR-042) : démo locale, production…
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Le catalogue de composants n'existe que dans le client de développement.
const profile = process.env.EAS_BUILD_PROFILE ?? "development";

function localizedName(brand: string) {
  return { ios: { CFBundleDisplayName: brand }, android: { app_name: brand } };
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: commonFr.brand,
  slug: "ohyoushouldnt",
  scheme: "ohyoushouldnt",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/images/icon.png",
  backgroundColor: "#e8f0ff",
  locales: { fr: localizedName(commonFr.brand), en: localizedName(commonEn.brand) },
  ios: {
    bundleIdentifier: "app.ohyoushouldnt.mobile",
    supportsTablet: false,
    infoPlist: { CFBundleAllowMixedLocalizations: true },
  },
  android: {
    package: "app.ohyoushouldnt.mobile",
    // Aucune permission demandée (publication future sur les stores).
    permissions: [],
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
    [
      "expo-splash-screen",
      { backgroundColor: "#e8f0ff", image: "./assets/images/splash-icon.png", imageWidth: 160 },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { apiUrl, devCatalog: profile === "development" },
});
