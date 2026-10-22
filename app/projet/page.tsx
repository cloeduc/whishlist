import type { Metadata } from "next";
import Image from "next/image";
import { ContentPage, ContentSection } from "@/components/site/content-page";
import { LinkButton } from "@/components/site/link-button";
import { getLocale, getTranslations } from "@/src/i18n/server";
import { getProjectInstanceContent } from "@/src/site/instance-content";
import { SupportLabel } from "@/components/site/support-label";
import { GITHUB_REPO_URL, supportUrl } from "@/src/site/links";
import { publicPageMetadata } from "@/src/site/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content");
  return await publicPageMetadata({
    title: t("project.metaTitle"),
    description: t("project.metaDescription"),
    path: "/projet",
  });
}

export default async function ProjectPage() {
  const [t, locale] = await Promise.all([getTranslations("content"), getLocale()]);
  const instance = getProjectInstanceContent(locale);
  const donate = supportUrl();

  return (
    <ContentPage
      eyebrow={t("project.eyebrow")}
      title={t("project.title")}
      intro={instance?.portrait ? "" : (instance?.intro ?? t("project.intro"))}
    >
      {instance?.portrait ? (
        <div className="flex max-w-3xl flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Image
            src={instance.portrait.src}
            alt={instance.portrait.alt}
            width={512}
            height={512}
            className="size-40 shrink-0 rounded-base border-2 border-border object-cover shadow-shadow sm:size-48"
            priority
          />
          <p className="text-pretty text-lg text-muted-foreground">{instance.intro}</p>
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <ContentSection title={t("project.practiceTitle")}>
          <p>{t("project.practiceBody")}</p>
        </ContentSection>
        <ContentSection title={t("project.beforeTitle")}>
          <p>{t("project.beforeBody")}</p>
        </ContentSection>
        <ContentSection title={t("project.buildTitle")}>
          <p>{t("project.buildBody")}</p>
        </ContentSection>
        <ContentSection title={t("project.usefulTitle")}>
          <p>{t("project.usefulBody")}</p>
        </ContentSection>
      </div>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/inscription">{t("project.cta")}</LinkButton>
        {donate ? (
          <LinkButton href={donate} variant="outline" target="_blank" rel="noreferrer">
            <SupportLabel>{t("project.support")}</SupportLabel>
          </LinkButton>
        ) : null}
        <LinkButton href="/guide" variant="outline">
          {t("project.guide")}
        </LinkButton>
        <LinkButton href={GITHUB_REPO_URL} variant="ghost" target="_blank" rel="noreferrer">
          {t("project.github")}
        </LinkButton>
      </div>
    </ContentPage>
  );
}
