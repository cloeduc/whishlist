import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/content-page";
import { withLocale } from "@/src/i18n/locale-path";
import { getLocale, getTranslations } from "@/src/i18n/server";
import { CONTACT_EMAIL } from "@/src/site/contact";
import { publicPageMetadata } from "@/src/site/seo";

const LINK = "font-medium text-foreground underline underline-offset-4 hover:no-underline";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content");
  return await publicPageMetadata({
    title: t("legal.metaTitle"),
    description: t("legal.metaDescription"),
    path: "/mentions-legales",
  });
}

export default async function LegalPage() {
  const [t, locale] = await Promise.all([getTranslations("content"), getLocale()]);
  return (
    <ContentPage
      eyebrow={t("legal.eyebrow")}
      title={t("legal.title")}
      intro={t("legal.intro")}
    >
      <ContentSection title={t("legal.publisherTitle")}>
        <div className="flex flex-col gap-3">
          <p>{t("legal.publisherBody")}</p>
          <p>{t("legal.publisherLaw")}</p>
        </div>
      </ContentSection>
      <ContentSection title={t("legal.hostTitle")}>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="font-bold">{t("legal.hostName")}</dt>
          </div>
          <div>
            <dt className="sr-only">{t("legal.hostAddressLabel")}</dt>
            <dd>{t("legal.hostAddress")}</dd>
          </div>
          <div>
            <dt className="sr-only">{t("legal.hostWebsiteLabel")}</dt>
            <dd>
              <a href="https://www.cloudflare.com" target="_blank" rel="noreferrer" className={LINK}>
                {t("legal.hostWebsite")}
              </a>
            </dd>
          </div>
        </dl>
      </ContentSection>
      <ContentSection title={t("legal.privacyTitle")}>
        <div className="flex flex-col gap-3">
          <p>
            <Link href={withLocale(locale, "/donnees-personnelles")} className={LINK}>
              {t("legal.privacyLink")}
            </Link>
          </p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
              {t("legal.contact", { email: CONTACT_EMAIL })}
            </a>
          </p>
        </div>
      </ContentSection>
    </ContentPage>
  );
}
