import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/site/content-page";
import { llmConfigured } from "@/src/domain/product-llm";
import { getTranslations } from "@/src/i18n/server";
import { mailConfigured } from "@/src/server/mail";
import { publicPageMetadata } from "@/src/site/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content");
  return await publicPageMetadata({
    title: t("legal.metaTitle"),
    description: t("legal.metaDescription"),
    path: "/mentions-legales",
  });
}

export default async function LegalPage() {
  const t = await getTranslations("content");
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
              <a
                href="https://www.planethoster.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                {t("legal.hostWebsite")}
              </a>
            </dd>
          </div>
        </dl>
      </ContentSection>
      <ContentSection title={t("legal.privacyTitle")}>
        <div className="flex flex-col gap-3">
          <p>{t("legal.privacyBody")}</p>
          <p>{t("legal.cookiesBody")}</p>
          {mailConfigured() ? <p>{t("legal.mailBody")}</p> : null}
          {llmConfigured() ? <p>{t("legal.aiBody")}</p> : null}
          <p>
            <a
              href="mailto:contact@ohyoushouldnt.app"
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              {t("legal.contact")}
            </a>
          </p>
        </div>
      </ContentSection>
    </ContentPage>
  );
}
