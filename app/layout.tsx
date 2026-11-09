import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, origin } from "../src/auth/current";
import { AnalyticsScript } from "@/components/site/analytics-script";
import { GiftMark } from "@/components/site/gift-mark";
import { SiteFooter } from "@/components/site/site-footer";
import { EmailVerificationBanner } from "@/components/site/email-verification-banner";
import { GetAppButton } from "@/components/site/get-app-button";
import { RootShell } from "@/components/site/root-shell";
import { SiteNav } from "@/components/site/site-nav";
import { withLocale } from "@/src/i18n/locale-path";
import { getLocale, getTranslations } from "@/src/i18n/server";
import { analyticsConfigured } from "@/src/server/analytics";
import { appStoreUrl, playStoreUrl, supportUrl } from "@/src/site/links";
import { siteOrigin } from "@/src/site/seo";
import "./globals.css";
import { emailConfirmationPending } from "@/src/server/commands/context";


/**
 * No page is ever rendered at build time. Session and language are cookies, and the Docker image is
 * built with a placeholder SESSION_SECRET that the session code refuses before it reaches cookies():
 * without this flag, the build tries to prerender pages and fails. It applies to every page below.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("common"), getLocale()]);
  const origin = siteOrigin();
  return {
    metadataBase: new URL(origin),
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      type: "website",
      locale: locale === "en" ? "en_US" : "fr_FR",
    },
    icons: {
      icon: [{ url: "/favicon.png", type: "image/png" }],
      apple: [{ url: "/favicon.png" }],
      shortcut: ["/favicon.png"],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, locale, t, tContent] = await Promise.all([
    currentUser(),
    getLocale(),
    getTranslations("common"),
    getTranslations("content"),
  ]);
  const analytics = analyticsConfigured();
  return (
    <RootShell locale={locale} end={<AnalyticsScript />}>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-base focus:border-2 focus:border-border focus:bg-main focus:px-3 focus:py-2 focus:text-main-foreground focus:shadow-shadow"
      >
        {t("nav.skip")}
      </a>
      <header className="flex flex-wrap items-center gap-3">
        <Link
          href={withLocale(locale, "/")}
          aria-label={t("nav.homeAria")}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
        >
          <GiftMark className="size-8" title="" />
          <span aria-hidden>{t("brand")}</span>
        </Link>
        <GetAppButton appStoreUrl={appStoreUrl()} playStoreUrl={playStoreUrl()} locale={locale} />
        <SiteNav
          locale={locale}
          supportUrl={supportUrl()}
          user={user ? { mustChangePassword: user.mustChangePassword } : null}
        />
      </header>
      {user && emailConfirmationPending(user) ? (
        <EmailVerificationBanner origin={await origin()} />
      ) : null}
      <div id="content" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <SiteFooter
        infoLabel={t("footer.info")}
        tagline={t("footer.tagline")}
        github={t("footer.github")}
        support={t("footer.support")}
        supportUrl={supportUrl()}
        project={tContent("nav.project")}
        faq={tContent("nav.faq")}
        guide={tContent("nav.guide")}
        legal={tContent("nav.legal")}
        privacy={tContent("privacy.title")}
        locale={locale}
        analytics={
          analytics
            ? { offLabel: tContent("privacy.optOut"), onLabel: tContent("privacy.optOutOn") }
            : null
        }
      />
    </RootShell>
  );
}
