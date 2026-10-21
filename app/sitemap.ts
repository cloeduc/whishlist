import type { MetadataRoute } from "next";
import { siteOrigin } from "@/src/site/seo";

const PATHS = ["/", "/projet", "/faq", "/guide", "/mentions-legales"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return PATHS.map((path) => ({
    url: new URL(path, origin).toString(),
  }));
}
