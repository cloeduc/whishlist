import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

// Same texts and same namespaces as the site (R8).
import { defaultLocale, namespaces, type Locale } from "../../../src/i18n/config";
import { resources } from "../../../src/i18n/resources";

/** English if the phone's first language is English, French otherwise. */
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

/** Same rule as the site's `translateErrorFor`: the code if there is no translation. */
export function translateError(code: string): string {
  return i18n.t(code, { ns: "errors", defaultValue: "" }) || code;
}

/** BCP 47 locale for Intl (times, prices). */
export { intlLocale } from "../../../src/i18n/config";
/** Links to the site in the app language. */
export { withLocale } from "../../../src/i18n/locale-path";
