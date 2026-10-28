import { readFileSync } from "node:fs";
import { join } from "node:path";

import { i18n, pickLocale, translateError } from "@/i18n";

const locales = join(__dirname, "../../locales");

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

test("English when the phone's first language is English, French otherwise", () => {
  expect(pickLocale(["en"])).toBe("en");
  expect(pickLocale(["en-GB", "fr"])).toBe("en");
  expect(pickLocale(["fr-FR"])).toBe("fr");
  expect(pickLocale(["de-DE", "en"])).toBe("fr");
  expect(pickLocale([])).toBe("fr");
});

test("site keys translate in both languages", () => {
  expect(i18n.t("auth:login.submit", { lng: "fr" })).toBe("Se connecter");
  expect(i18n.t("auth:login.submit", { lng: "en" })).toBe("Log in");
});

test("error codes translate like translateErrorFor on the site", async () => {
  await i18n.changeLanguage("fr");
  expect(translateError("invalidCredentials")).toBe("E-mail ou mot de passe incorrect.");
  expect(translateError("someUnknownCode")).toBe("someUnknownCode");
});

test("the mobile namespace has the same keys in French and English", () => {
  const fr = JSON.parse(readFileSync(join(locales, "fr/mobile.json"), "utf8"));
  const en = JSON.parse(readFileSync(join(locales, "en/mobile.json"), "utf8"));
  expect(keys(en).sort()).toEqual(keys(fr).sort());
});
