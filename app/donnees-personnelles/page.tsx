import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/site/content-page";
import { llmConfigured } from "@/src/domain/product-llm";
import { getTranslations } from "@/src/i18n/server";
import { analyticsConfigured } from "@/src/server/analytics";
import { mailConfigured } from "@/src/server/mail";
import { CONTACT_EMAIL } from "@/src/site/contact";
import { publicPageMetadata } from "@/src/site/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content");
  return await publicPageMetadata({
    title: t("privacy.metaTitle"),
    description: t("privacy.metaDescription"),
    path: "/donnees-personnelles",
  });
}

/** Lien de politique de confidentialité donné aux stores. Même texte que l'écran de l'app. */
export default async function PrivacyPage() {
  const t = await getTranslations("content");
  return (
    <ContentPage eyebrow={t("privacy.eyebrow")} title={t("privacy.title")} intro={t("privacy.intro")}>
      <ContentSection title={t("privacy.accountTitle")}>
        <p>{t("privacy.accountBody")}</p>
      </ContentSection>
      <ContentSection title={t("privacy.listsTitle")}>
        <p>{t("privacy.listsBody")}</p>
      </ContentSection>
      <ContentSection title={t("privacy.reservationsTitle")}>
        <p>{t("privacy.reservationsBody")}</p>
      </ContentSection>
      <ContentSection title={t("privacy.retentionTitle")}>
        <p>{t("privacy.retentionBody")}</p>
      </ContentSection>
      <ContentSection title={t("privacy.cookiesTitle")}>
        <p>{t("privacy.cookiesBody")}</p>
      </ContentSection>
      <ContentSection title={t("privacy.appTitle")}>
        <p>{t("privacy.appBody")}</p>
      </ContentSection>
      <ContentSection title={t("privacy.providersTitle")}>
        <div className="flex flex-col gap-3">
          <p>{t("privacy.cloudflareBody")}</p>
          {mailConfigured() ? <p>{t("privacy.mailBody")}</p> : null}
          {llmConfigured() ? <p>{t("privacy.aiBody")}</p> : null}
          {analyticsConfigured() ? <p>{t("privacy.audienceBody")}</p> : null}
        </div>
      </ContentSection>
      <ContentSection title={t("privacy.rightsTitle")}>
        <p>
          {t("privacy.rightsBody", { email: CONTACT_EMAIL })}
        </p>
      </ContentSection>
    </ContentPage>
  );
}
