import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

// Mêmes textes et mêmes namespaces que le site (R8).
import { defaultLocale, namespaces, type Locale } from "../../../src/i18n/config";
import { resources } from "../../../src/i18n/resources";

/** Anglais si la première langue du téléphone est l'anglais, français sinon. */
export function pickLocale(languageCodes: readonly (string | null | undefined)[]): Locale {
  return languageCodes[0]?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function deviceLocale(): Locale {
  return pickLocale(getLocales().map((locale) => locale.languageCode ?? locale.languageTag));
}

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLocale(),
  fallbackLng: defaultLocale,
  ns: [...namespaces],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  initAsync: false,
});

export function currentLocale(): Locale {
  return i18n.language === "en" ? "en" : "fr";
}

/** Même règle que `translateErrorFor` du site : le code si aucune traduction. */
export function translateError(code: string): string {
  return i18n.t(code, { ns: "errors", defaultValue: "" }) || code;
}

/** Locale BCP 47 pour Intl (heures, prix). */
export { intlLocale } from "../../../src/i18n/config";
/** Liens vers le site dans la langue de l'app. */
export { withLocale } from "../../../src/i18n/locale-path";
