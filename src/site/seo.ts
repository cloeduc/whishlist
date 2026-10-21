import type { Metadata } from "next";
import { originFromEnv } from "@/src/auth/origin";

export function siteOrigin(): string {
  return originFromEnv() ?? "http://localhost:3000";
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
