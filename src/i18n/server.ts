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

export async function getTranslations(ns: Namespace | Namespace[] = "common"): Promise<TFunction> {
  const locale = await getLocale();
  const instance = await i18nFor(locale);
  return instance.getFixedT(locale, ns);
}

export async function translateError(code: string): Promise<string> {
  const t = await getTranslations("errors");
  const translated = t(code, { defaultValue: "" });
  return translated || code;
}

/** Client-friendly: error codes from domain/actions → localized string. */
export function errorMessage(tErrors: TFunction, code: string | null | undefined): string | null {
  if (!code) return null;
  const translated = tErrors(code, { defaultValue: "" });
  return translated || code;
}
