export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
export const localeCookie = "NEXT_LOCALE";

export const namespaces = ["common", "auth", "home", "list", "public", "errors", "mail", "content"] as const;
export type Namespace = (typeof namespaces)[number];

/** Locale BCP 47 pour Intl (prix, dates). */
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "fr" || value === "en";
}
