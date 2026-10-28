import { createInstance, type i18n, type TFunction } from "i18next";
import { headers } from "next/headers";
import { cache } from "react";
import { defaultLocale, isLocale, namespaces, type Locale, type Namespace } from "./config";
import { resources } from "./resources";

const ready = new Map<Locale, Promise<i18n>>();

function i18nFor(locale: Locale): Promise<i18n> {
  let pending = ready.get(locale);
  if (!pending) {
    pending = (async () => {
      const instance = createInstance();
      await instance.init({
        lng: locale,
        fallbackLng: defaultLocale,
        ns: [...namespaces],
        defaultNS: "common",
        resources,
        interpolation: { escapeValue: false },
        returnNull: false,
      });
      return instance;
    })();
    ready.set(locale, pending);
  }
  return pending;
}

// Warm both locales once (shared across requests).
void i18nFor("fr");
void i18nFor("en");

export const getLocale = cache(async (): Promise<Locale> => {
  const fromUrl = (await headers()).get("x-locale");
  if (isLocale(fromUrl)) return fromUrl;
  return defaultLocale;
});

/** Traductions d'une langue donnée (API, commandes) — sans lire la requête. */
export async function getTranslationsFor(
  locale: Locale,
  ns: Namespace | Namespace[] = "common",
): Promise<TFunction> {
  const instance = await i18nFor(locale);
  return instance.getFixedT(locale, ns);
}

export async function getTranslations(ns: Namespace | Namespace[] = "common"): Promise<TFunction> {
  return getTranslationsFor(await getLocale(), ns);
}

export async function translateErrorFor(locale: Locale, code: string): Promise<string> {
  const t = await getTranslationsFor(locale, "errors");
  const translated = t(code, { defaultValue: "" });
  return translated || code;
}

export async function translateError(code: string): Promise<string> {
  return translateErrorFor(await getLocale(), code);
}

/** Client-friendly: error codes from domain/actions → localized string. */
export function errorMessage(tErrors: TFunction, code: string | null | undefined): string | null {
  if (!code) return null;
  const translated = tErrors(code, { defaultValue: "" });
  return translated || code;
}
