"use client";

import { createInstance } from "i18next";
import { useMemo } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { defaultLocale, namespaces, type Locale } from "./config";
import { resources } from "./resources";

function createClientI18n(locale: Locale) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: defaultLocale,
    ns: [...namespaces],
    defaultNS: "common",
    resources,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const i18n = useMemo(() => createClientI18n(locale), [locale]);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
