import type { MetadataRoute } from "next";
import { siteOrigin } from "@/src/site/seo";

/** L'origine se lit à la requête : un build sans APP_ORIGIN ne doit pas figer localhost. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
      "/l/",
      "/en/l/",
      "/inviter/",
      "/en/inviter/",
      "/reinitialiser/",
      "/en/reinitialiser/",
      "/compte",
      "/en/compte",
      "/listes/",
      "/en/listes/",
    ],
    },
    sitemap: new URL("/sitemap.xml", siteOrigin()).toString(),
  };
}
