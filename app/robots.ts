import type { MetadataRoute } from "next";
import { siteOrigin } from "@/src/site/seo";

/** The origin is read per request: a build without APP_ORIGIN must not freeze localhost. */
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
