import type { MetadataRoute } from "next";
import { siteOrigin } from "@/src/site/seo";

/** L'origine se lit à la requête : un build sans APP_ORIGIN ne doit pas figer localhost. */
export const dynamic = "force-dynamic";

const PATHS = ["/", "/projet", "/faq", "/guide", "/mentions-legales"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return PATHS.map((path) => ({
    url: new URL(path, origin).toString(),
  }));
}
