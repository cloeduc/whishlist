import type { MetadataRoute } from "next";
import { formerPathsUnder } from "@/src/site/legacy-paths";
import { siteOrigin } from "@/src/site/seo";

/** Capability or session addresses. */
const PRIVATE_PATHS = ["/l/", "/invite/", "/reset-password/", "/confirm-email/", "/account", "/lists/", "/login", "/register"];

/** Their former French paths (feature 018): redirected, but a token in them must not be crawled before. */
const LEGACY_PRIVATE_PATHS = formerPathsUnder(PRIVATE_PATHS);

/** The origin is read per request: a build without APP_ORIGIN must not freeze localhost. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_PATHS, ...LEGACY_PRIVATE_PATHS].flatMap((path) => [path, `/en${path}`]),
    },
    sitemap: new URL("/sitemap.xml", siteOrigin()).toString(),
  };
}
