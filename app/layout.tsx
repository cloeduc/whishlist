import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { currentUser } from "../src/auth/current";
import { GiftMark } from "@/components/site/gift-mark";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { cn } from "@/lib/utils";
import { I18nProvider } from "@/src/i18n/client";
import { getLocale, getTranslations } from "@/src/i18n/server";
import { supportUrl } from "@/src/site/links";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    icons: {
      icon: [{ url: "/favicon.png", type: "image/png" }],
      apple: [{ url: "/favicon.png" }],
      shortcut: ["/favicon.png"],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, locale, t] = await Promise.all([currentUser(), getLocale(), getTranslations("common")]);
  return (
    <html lang={locale} className={cn("overflow-x-clip font-sans", geist.variable)}>
      <body className="overflow-x-clip">
        <I18nProvider locale={locale}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">
            <header className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
              >
                <GiftMark className="size-8" title={t("brand")} />
                {t("brand")}
              </Link>
              <SiteNav
                locale={locale}
                user={
                  user
                    ? { displayName: user.displayName, mustChangePassword: user.mustChangePassword }
                    : null
                }
              />
            </header>
            {children}
            <SiteFooter
              selfHost={t("footer.selfHost")}
              github={t("footer.github")}
              support={t("footer.support")}
              supportUrl={supportUrl()}
            />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
