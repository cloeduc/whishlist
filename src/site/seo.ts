import type { Metadata } from "next";
import { originFromEnv } from "@/src/auth/origin";

/** Ancien nom d'hôte, encore servi. Les liens publics doivent viser le domaine actuel. */
const LEGACY_ORIGIN = "https://wishlist.mesdamesduc.fr";
const LEGACY_HOST = "wishlist.mesdamesduc.fr";
export const PUBLIC_ORIGIN = "https://ohyoushouldnt.app";

/** Remplace l'ancienne origine configurée. Une autre origine explicite est conservée. */
export function preferredOrigin(origin: string | null): string | null {
  if (origin === LEGACY_ORIGIN) return PUBLIC_ORIGIN;
  return origin;
}

export function siteOrigin(): string {
  return preferredOrigin(originFromEnv()) ?? "http://localhost:3000";
}

/**
 * 301 vers le domaine public si la requête arrive sur l'ancien hôte.
 * La cible est fixe : le chemin est recopié, pas l'en-tête Host.
 */
export function legacyHostRedirect(hostHeader: string | null, pathname: string, search: string): URL | null {
  const host = hostHeader?.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") ?? "";
  if (host !== LEGACY_HOST) return null;
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\")) return null;
  const url = new URL(PUBLIC_ORIGIN);
  url.pathname = pathname;
  url.search = search;
  if (url.origin !== PUBLIC_ORIGIN) return null;
  return url;
}

/** Pages marketing et comptes publics. Pas de hreflang : la langue est un cookie. */
export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}
