import type { MetadataRoute } from "next";
import { siteOrigin } from "@/src/site/seo";

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
