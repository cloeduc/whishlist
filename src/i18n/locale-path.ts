import { canonicalSitePath } from "../site/legacy-paths";
import { isLocale, type Locale } from "./config";

export function stripLocalePrefix(pathname: string): { locale: Locale; path: string } {
  if (pathname === "/en" || pathname === "/en/") return { locale: "en", path: "/" };
  if (pathname.startsWith("/en/")) return { locale: "en", path: pathname.slice(3) || "/" };
  if (pathname === "/fr" || pathname === "/fr/") return { locale: "fr", path: "/" };
  if (pathname.startsWith("/fr/")) return { locale: "fr", path: pathname.slice(3) || "/" };
  return { locale: "fr", path: pathname || "/" };
}

/** English prefix only. Canonical French has no prefix. */
export function withLocale(locale: Locale, pathname: string): string {
  const bare = stripLocalePrefix(pathname).path;
  if (!bare.startsWith("/") || bare.startsWith("//")) return pathname;
  if (locale === "fr") return bare;
  return bare === "/" ? "/en" : `/en${bare}`;
}

export type LocaleDecision =
  | { type: "redirect"; status: 301 | 307; pathname: string; search: string; locale: Locale }
  | { type: "rewrite"; pathname: string; search: string; locale: Locale }
  | { type: "continue"; locale: Locale };

/** Internal site path (`/invite/…`), never another origin (`//host`, `/\\host`, `https://…`). */
export function internalPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

function pathOnly(value: string | null): string | null {
  if (!value) return null;
  return internalPath(value.split("?")[0]?.split("#")[0] ?? "");
}

/**
 * The address decides the language. `?lang=` and `/fr` redirect to the canonical URL.
 * An internal navigation from `/en` keeps the prefix.
 * A former French address (feature 018) redirects permanently to its English address, in the same
 * step as the language; a form posted to it (other method than GET/HEAD) is rewritten instead, so
 * that its body is not lost.
 */
export function decideLocaleRoute(input: {
  pathname: string;
  search: string;
  nextUrl: string | null;
  method?: string;
}): LocaleDecision {
  const params = new URLSearchParams(input.search.startsWith("?") ? input.search.slice(1) : input.search);
  const lang = params.get("lang");
  const hasLang = isLocale(lang);
  if (hasLang) params.delete("lang");
  const query = params.toString();
  const search = hasLang ? (query ? `?${query}` : "") : input.search;

  const current = stripLocalePrefix(input.pathname);
  const frenchPrefix = input.pathname === "/fr" || input.pathname.startsWith("/fr/");
  const canonical = canonicalSitePath(current.path, search);
  const method = (input.method ?? "GET").toUpperCase();

  if (canonical.changed && method !== "GET" && method !== "HEAD") {
    return {
      type: "rewrite",
      pathname: canonical.path,
      search: canonical.search,
      locale: hasLang ? lang : current.locale,
    };
  }

  const fromNavigation = pathOnly(input.nextUrl);
  const fromEnglishPage =
    current.locale === "fr" && !frenchPrefix && fromNavigation !== null && stripLocalePrefix(fromNavigation).locale === "en";

  if (hasLang || frenchPrefix || canonical.changed) {
    const locale: Locale = hasLang ? lang : current.locale === "en" || fromEnglishPage ? "en" : "fr";
    return {
      type: "redirect",
      status: 301,
      pathname: withLocale(locale, canonical.path),
      search: canonical.search,
      locale,
    };
  }

  if (current.locale === "en") {
    return { type: "rewrite", pathname: current.path, search: input.search, locale: "en" };
  }

  if (fromEnglishPage) {
    return {
      type: "redirect",
      status: 307,
      pathname: withLocale("en", current.path),
      search: input.search,
      locale: "en",
    };
  }

  return { type: "continue", locale: "fr" };
}
