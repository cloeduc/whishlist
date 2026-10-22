import type { MetadataRoute } from "next";
import { siteOrigin } from "@/src/site/seo";

/** L'origine se lit à la requête : un build sans APP_ORIGIN ne doit pas figer localhost. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/l/", "/inviter/", "/reinitialiser/", "/compte", "/listes/"],
    },
    sitemap: new URL("/sitemap.xml", siteOrigin()).toString(),
  };
}
