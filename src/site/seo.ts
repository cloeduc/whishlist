import type { Metadata } from "next";
import { originFromEnv } from "@/src/auth/origin";
import { getLocale } from "@/src/i18n/server";
import { internalPath, withLocale } from "@/src/i18n/locale-path";

/** Old host name, still served. Public links must target the current domain. */
const LEGACY_ORIGIN = "https://wishlist.mesdamesduc.fr";
const LEGACY_HOST = "wishlist.mesdamesduc.fr";
export const PUBLIC_ORIGIN = "https://ohyoushouldnt.app";

/** Replaces the old configured origin. Another explicit origin is kept. */
export function preferredOrigin(origin: string | null): string | null {
  if (origin === LEGACY_ORIGIN) return PUBLIC_ORIGIN;
  return origin;
}

export function siteOrigin(): string {
  return preferredOrigin(originFromEnv()) ?? "http://localhost:3000";
}

/**
 * 301 to the public domain if the request arrives on the old host.
 * The target is fixed: the path is copied, not the Host header.
 */
export function legacyHostRedirect(hostHeader: string | null, pathname: string, search: string): URL | null {
  const host = hostHeader?.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") ?? "";
  if (host !== LEGACY_HOST) return null;
  if (!internalPath(pathname)) return null;
  const url = new URL(PUBLIC_ORIGIN);
  url.pathname = pathname;
  url.search = search;
  if (url.origin !== PUBLIC_ORIGIN) return null;
  return url;
}

/** Public pages. The canonical and hreflang follow the language's address. */
export async function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Promise<Metadata> {
  const locale = await getLocale();
  const fr = withLocale("fr", input.path);
  const en = withLocale("en", input.path);
  const canonical = withLocale(locale, input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: {
        fr,
        en,
        "x-default": fr,
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      type: "website",
      locale: locale === "en" ? "en_US" : "fr_FR",
    },
    robots: { index: true, follow: true },
  };
}
