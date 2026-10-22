import type { MetadataRoute } from "next";
import { withLocale } from "@/src/i18n/locale-path";
import { siteOrigin } from "@/src/site/seo";

/** L'origine se lit à la requête : un build sans APP_ORIGIN ne doit pas figer localhost. */
export const dynamic = "force-dynamic";

const PATHS = ["/", "/projet", "/faq", "/guide", "/mentions-legales"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return PATHS.flatMap((path) => {
    const languages = {
      fr: new URL(withLocale("fr", path), origin).toString(),
      en: new URL(withLocale("en", path), origin).toString(),
    };
    return (["fr", "en"] as const).map((locale) => ({
      url: languages[locale],
      alternates: { languages },
    }));
  });
}
